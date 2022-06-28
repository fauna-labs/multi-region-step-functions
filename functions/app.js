// Copyright Fauna, Inc.
// SPDX-License-Identifier: MIT-0

import faunadb from 'faunadb';

export async function sendMessage(event) {
    const chat = event["chat"];
    const language = event["language"];
    const message = event["message"];

    const options = {
        secret: process.env.FAUNA_API_KEY,
        domain: process.env.FAUNA_DOMAIN,
    }

    const client = createClient(options);

    try {
        const { Call } = faunadb.query;

        const result = await client.query(
            Call(
                'CreateMessage',
                [chat, language, message]
            )
        );

        return result;

    } catch (e) {
        const faunaError = getFaunaError(e);

        return faunaError;
    }
};

export async function getNewMessages(event) {
    return true;
}

export async function storeTranslatedMessage(event) {
    return true;
}

// Helper functions
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
