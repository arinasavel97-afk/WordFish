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

const SETS_SELECT_FIELDS = "id, name, created_at, updated_at, position, is_favorite";
const SETS_SELECT_FIELDS_WITH_ACCENT = `${SETS_SELECT_FIELDS}, accent_color`;

let dbAccentColorColumnAvailable = null;

function dbIsMissingAccentColorColumnError(error) {
    if (!error) {
        return false;
    }

    const message = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();

    return message.includes("accent_color") && (
        message.includes("does not exist")
        || message.includes("could not find")
        || message.includes("schema cache")
    );
}

function mapDatabaseSetRow(set, includeAccentColor) {
    const mapped = {
        id: set.id,
        name: set.name,
        position: set.position,
        created_at: set.created_at,
        updated_at: set.updated_at,
        is_favorite: !!set.is_favorite
    };

    if (set.deleted_at !== undefined) {
        mapped.deleted_at = set.deleted_at;
    }

    if (includeAccentColor) {
        mapped.accentColor = set.accent_color || null;
    }

    return mapped;
}

async function dbQueryActiveSets(includeAccentColor) {
    const selectFields = includeAccentColor ? SETS_SELECT_FIELDS_WITH_ACCENT : SETS_SELECT_FIELDS;

    return supabaseClient
        .from("sets")
        .select(selectFields)
        .is("deleted_at", null)
        .order("position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
}

async function dbQueryTrashedSets(includeAccentColor) {
    const selectFields = includeAccentColor
        ? `${SETS_SELECT_FIELDS_WITH_ACCENT}, deleted_at`
        : `${SETS_SELECT_FIELDS}, deleted_at`;

    return supabaseClient
        .from("sets")
        .select(selectFields)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
}

async function dbLoadSetsWithCards() {
    let includeAccentColor = dbAccentColorColumnAvailable !== false;
    let { data: sets, error: setsError } = await dbQueryActiveSets(includeAccentColor);

    if (setsError && includeAccentColor && dbIsMissingAccentColorColumnError(setsError)) {
        dbAccentColorColumnAvailable = false;
        includeAccentColor = false;
        ({ data: sets, error: setsError } = await dbQueryActiveSets(false));
    } else if (!setsError && includeAccentColor) {
        dbAccentColorColumnAvailable = true;
    }

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
            ...mapDatabaseSetRow(set, includeAccentColor),
            cards: cardsForSet
        };
    });
}

async function dbLoadTrashedSetsWithCards() {
    let includeAccentColor = dbAccentColorColumnAvailable !== false;
    let { data: sets, error: setsError } = await dbQueryTrashedSets(includeAccentColor);

    if (setsError && includeAccentColor && dbIsMissingAccentColorColumnError(setsError)) {
        dbAccentColorColumnAvailable = false;
        includeAccentColor = false;
        ({ data: sets, error: setsError } = await dbQueryTrashedSets(false));
    } else if (!setsError && includeAccentColor) {
        dbAccentColorColumnAvailable = true;
    }

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
            ...mapDatabaseSetRow(set, includeAccentColor),
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

async function dbInsertSetRecord(name, userId, accentColor = null) {
    const insertPayload = {
        name: name,
        user_id: userId
    };

    if (accentColor && dbAccentColorColumnAvailable !== false) {
        insertPayload.accent_color = accentColor;
    }

    let result = await supabaseClient
        .from("sets")
        .insert(insertPayload)
        .select(dbAccentColorColumnAvailable === false ? "id, name" : "id, name, accent_color")
        .single();

    if (result.error && insertPayload.accent_color && dbIsMissingAccentColorColumnError(result.error)) {
        dbAccentColorColumnAvailable = false;
        delete insertPayload.accent_color;
        result = await supabaseClient
            .from("sets")
            .insert(insertPayload)
            .select("id, name")
            .single();
    } else if (!result.error && insertPayload.accent_color) {
        dbAccentColorColumnAvailable = true;
    }

    if (result.error) {
        throw result.error;
    }

    return result.data;
}

async function dbUpdateSetRecord(setId, name, accentColor = null) {
    const updatePayload = {
        name: name,
        updated_at: new Date().toISOString()
    };

    if (accentColor && dbAccentColorColumnAvailable !== false) {
        updatePayload.accent_color = accentColor;
    }

    let { error } = await supabaseClient
        .from("sets")
        .update(updatePayload)
        .eq("id", setId);

    if (error && updatePayload.accent_color && dbIsMissingAccentColorColumnError(error)) {
        dbAccentColorColumnAvailable = false;
        delete updatePayload.accent_color;
        ({ error } = await supabaseClient
            .from("sets")
            .update(updatePayload)
            .eq("id", setId));
    } else if (!error && updatePayload.accent_color) {
        dbAccentColorColumnAvailable = true;
    }

    if (error) {
        throw error;
    }
}

async function dbCreateSetWithCards(name, cards, accentColor = null) {
    const user = await dbGetCurrentUser();

    if (!user) {
        throw new Error("You must be logged in to create a set.");
    }

    const newSet = await dbInsertSetRecord(name, user.id, accentColor);

    await dbReplaceCards(newSet.id, cards);

    return {
        id: newSet.id,
        name: newSet.name,
        accentColor: newSet.accent_color || accentColor || null,
        cards: cards
    };
}

async function dbSaveSetWithCards(setId, name, cards, accentColor = null) {
    if (!setId) {
        return await dbCreateSetWithCards(name, cards, accentColor);
    }

    await dbUpdateSetRecord(setId, name, accentColor);

    await dbReplaceCards(setId, cards);

    return {
        id: setId,
        name: name,
        accentColor: accentColor || null,
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
    return await dbCreateSetWithCards(duplicateName, copiedCards, sourceSet.accentColor || null);
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
