const SUPABASE_URL = "https://hnmaohnkagrknuuhygtj.supabase.co";
const SUPABASE_KEY = "sb_publishable_xdhhXoyxJPfth8qMoS_ekQ_Vnd-CYOS";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Supabase connected:", supabaseClient);

async function dbGetCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        throw error;
    }

    return data.user;
}

function mapDatabaseCard(card) {
    return {
        id: card.id,
        english: card.english || "",
        thai: card.translation || card.thai || "",
        imageUrl: card.image_url || ""
    };
}

function mapAppCard(card, position) {
    return {
        english: card.english.trim(),
        translation: (card.thai || "").trim(),
        image_url: card.imageUrl || "",
        position: position
    };
}

async function dbLoadSetsWithCards() {
    const { data: sets, error: setsError } = await supabaseClient
        .from("sets")
        .select("id, name, created_at, updated_at")
        .order("updated_at", { ascending: false });

    if (setsError) {
        throw setsError;
    }

    if (!sets || sets.length === 0) {
        return [];
    }

    const setIds = sets.map(set => set.id);

    const { data: allCards, error: cardsError } = await supabaseClient
        .from("cards")
        .select("id, set_id, english, translation, thai, image_url, position")
        .in("set_id", setIds)
        .order("position", { ascending: true });

    if (cardsError) {
        throw cardsError;
    }

    return sets.map(set => {
        const cardsForSet = (allCards || [])
            .filter(card => card.set_id === set.id)
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map(mapDatabaseCard);

        return {
            id: set.id,
            name: set.name,
            cards: cardsForSet
        };
    });
}

async function dbCreateSetWithCards(name, cards) {
    const user = await dbGetCurrentUser();

    if (!user) {
        throw new Error("You must be logged in to create a set.");
    }

    const { data: newSet, error: setError } = await supabaseClient
        .from("sets")
        .insert({
            name: name,
            user_id: user.id
        })
        .select("id, name")
        .single();

    if (setError) {
        throw setError;
    }

    await dbReplaceCards(newSet.id, cards);

    return {
        id: newSet.id,
        name: newSet.name,
        cards: cards
    };
}

async function dbSaveSetWithCards(setId, name, cards) {
    if (!setId) {
        return await dbCreateSetWithCards(name, cards);
    }

    const { error: setError } = await supabaseClient
        .from("sets")
        .update({
            name: name,
            updated_at: new Date().toISOString()
        })
        .eq("id", setId);

    if (setError) {
        throw setError;
    }

    await dbReplaceCards(setId, cards);

    return {
        id: setId,
        name: name,
        cards: cards
    };
}

async function dbReplaceCards(setId, cards) {
    const { error: deleteError } = await supabaseClient
        .from("cards")
        .delete()
        .eq("set_id", setId);

    if (deleteError) {
        throw deleteError;
    }

    const cleanedCards = cards
        .filter(card => card.english.trim() !== "")
        .map((card, index) => ({
            ...mapAppCard(card, index),
            set_id: setId
        }));

    if (cleanedCards.length === 0) {
        return;
    }

    const { error: insertError } = await supabaseClient
        .from("cards")
        .insert(cleanedCards);

    if (insertError) {
        throw insertError;
    }
}

async function dbDeleteSet(setId) {
    const { error } = await supabaseClient
        .from("sets")
        .delete()
        .eq("id", setId);

    if (error) {
        throw error;
    }
}

async function dbDuplicateSet(sourceSet) {
    const copiedCards = JSON.parse(JSON.stringify(sourceSet.cards || []));
    return await dbCreateSetWithCards(sourceSet.name + " Copy", copiedCards);
}
