import { eden } from "@/features/treaty"

export const getAccounts = async (limit: number, offset: number) => {
    const response = await eden.accounts.get({
        query: {
            limit: Number(limit),
            offset: Number(offset)
        }
    })
    return response
}