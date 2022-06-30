// Copyright Fauna, Inc.
// SPDX-License-Identifier: MIT-0

import faunadb from 'faunadb';

export async function sendMessage(event) {
    const chatID = event["chatID"];
    const language = event["language"];
    const text = event["text"];

    return await callUDF(
        "CreateMessage", 
        [chatID, language, text]
    );
};

export async function getNewMessages(event) {
    const chatID = event["chatID"];
    const language = event["language"];
    const lastSeenAt = event["lastSeenAt"] || 0;

    console.log({ chatID, language, lastSeenAt });

    return await callUDF(
        "GetNewMessages", 
        [chatID, language, lastSeenAt]
    );
}

export async function storeTranslatedMessage(event) {
    const messageID = event["messageID"];
    const language = event["translation"]["TargetLanguageCode"];
    const text = event["translation"]["TranslatedText"];

    return await callUDF(
        "StoreTranslation", 
        [messageID, language, text]
    );

}

// Helper functions
async function callUDF(name, args) {
    const options = {
        secret: process.env.FAUNA_API_KEY,
        domain: process.env.FAUNA_DOMAIN,
    }

    const client = createClient(options);

    try {
        const { Call } = faunadb.query;

        const result = await client.query(
            Call(
                name,
                args
            )
        );

        return result;

    } catch (e) {
        const faunaError = getFaunaError(e);

        return faunaError;
    }
}

function createClient(options) {
    return new faunadb.Client({
        ...options,
        headers: { 'X-Fauna-Source': 'sfn-fauna-blog' },
    });
}

function getFaunaError(error) {
    const { code, description } = error.requestResult.responseContent.errors[0];
    let status;

    switch (code) {
        case 'unauthorized':
        case 'authentication failed':
            status = 401;
            break;
        case 'permission denied':
            status = 403;
            break;
        case 'instance not found':
            status = 404;
            break;
        case 'instance not unique':
        case 'contended transaction':
            status = 409;
            break;
        default:
            status = 500;
    }

    return { code, description, status };
}
