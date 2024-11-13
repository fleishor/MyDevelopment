declare global {
        namespace NodeJS {
        interface ProcessEnv {
            AUTHORIZATION_TOKEN: string;
        }
    }
}

export {};
