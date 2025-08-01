import { eden } from "@/features/treaty"

export const getConversations = async (limit: number, offset: number) => {
    const response = await eden.conversations.get({
        query: {
            limit: Number(limit),
            offset: Number(offset)
        }
    })
    return response
}

export const getConversation = async (id: string, project: string) => {
    const response = await eden.conversations({ id: Number(id) }).get({
        query: {
            project
        }
    })
    return response
}

export const getConversationsByDate = async (start_date: string, end_date: string) => {
    const response = await eden.conversations.bydate.get({
        query: {
            start_date,
            end_date
        }
    })
    return response
}

export const getAllTimeConversations = async () => {
    const response = await eden.conversations.bydate.get({
        query: {}
    })
    return response
}

