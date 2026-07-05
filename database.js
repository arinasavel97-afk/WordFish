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
        .select("id, name, created_at, updated_at, position, is_favorite")
        .is("deleted_at", null)
        .order("position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

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
            position: set.position,
            created_at: set.created_at,
            updated_at: set.updated_at,
            is_favorite: !!set.is_favorite,
            cards: cardsForSet
        };
    });
}

async function dbLoadTrashedSetsWithCards() {
    const { data: sets, error: setsError } = await supabaseClient
        .from("sets")
        .select("id, name, created_at, updated_at, position, is_favorite, deleted_at")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

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
            position: set.position,
            created_at: set.created_at,
            updated_at: set.updated_at,
            deleted_at: set.deleted_at,
            is_favorite: !!set.is_favorite,
            cards: cardsForSet
        };
    });
}

async function dbUpdateSetPositions(orderedSets) {
    const updates = orderedSets.map((set, index) =>
        supabaseClient
            .from("sets")
            .update({ position: index + 1 })
            .eq("id", set.id)
    );

    const results = await Promise.all(updates);

    for (const result of results) {
        if (result.error) {
            throw result.error;
        }
    }
}

async function dbUpdateSetFavorite(setId, isFavorite) {
    const { error } = await supabaseClient
        .from("sets")
        .update({ is_favorite: isFavorite })
        .eq("id", setId);

    if (error) {
        throw error;
    }
}

async function dbRestoreSet(setId) {
    const { error } = await supabaseClient
        .from("sets")
        .update({ deleted_at: null })
        .eq("id", setId);

    if (error) {
        throw error;
    }
}

async function dbRestoreSets(setIds) {
    if (!setIds || setIds.length === 0) {
        return;
    }

    const { error } = await supabaseClient
        .from("sets")
        .update({ deleted_at: null })
        .in("id", setIds);

    if (error) {
        throw error;
    }
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
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", setId);

    if (error) {
        throw error;
    }
}

async function dbSoftDeleteSets(setIds) {
    if (!setIds || setIds.length === 0) {
        return;
    }

    const { error } = await supabaseClient
        .from("sets")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", setIds);

    if (error) {
        throw error;
    }
}

async function dbPermanentlyDeleteSets(setIds) {
    if (!setIds || setIds.length === 0) {
        return;
    }

    const { error: cardsError } = await supabaseClient
        .from("cards")
        .delete()
        .in("set_id", setIds);

    if (cardsError) {
        throw cardsError;
    }

    const { error: setsError } = await supabaseClient
        .from("sets")
        .delete()
        .in("id", setIds);

    if (setsError) {
        throw setsError;
    }
}

async function dbLoadPublicSetById(setId) {
    const { data: set, error: setError } = await supabaseClient
        .from("sets")
        .select("id, name")
        .eq("id", setId)
        .maybeSingle();

    if (setError) {
        throw setError;
    }

    if (!set) {
        return null;
    }

    const { data: setCards, error: cardsError } = await supabaseClient
        .from("cards")
        .select("id, set_id, english, translation, thai, image_url, position")
        .eq("set_id", setId)
        .order("position", { ascending: true });

    if (cardsError) {
        throw cardsError;
    }

    return {
        id: set.id,
        name: set.name,
        cards: (setCards || []).map(mapDatabaseCard)
    };
}

async function dbDuplicateSet(sourceSet, duplicateName) {
    const copiedCards = JSON.parse(JSON.stringify(sourceSet.cards || []));
    return await dbCreateSetWithCards(duplicateName, copiedCards);
}

async function dbUploadImage(file) {
    const user = await dbGetCurrentUser();

    if (!user) {
        throw new Error("You must be logged in to upload images.");
    }

    const safeFileName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, "-");

    const filePath = `${user.id}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabaseClient.storage
        .from("wordfish-images")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
        });

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabaseClient.storage
        .from("wordfish-images")
        .getPublicUrl(filePath);

    return data.publicUrl;
}
