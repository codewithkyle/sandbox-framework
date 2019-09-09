interface Window
{
    apiManager: APIManager;
}

declare class Notify
{
    constructor({ message: string })
}

interface APIManager
{
    submitToken(token:string) : Promise<any>
}
declare var apiManager: APIManager;
