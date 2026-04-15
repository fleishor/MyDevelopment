namespace Road.API;

using Microsoft.Kiota.Http.HttpClientLibrary;

/// <summary>
/// Service collection extensions for Kiota handlers.
/// </summary>
public static class KiotaServiceCollectionExtensions
{
    // Adds the Kiota handlers to the service collection.
    public static IServiceCollection AddKiotaHandlers(this IServiceCollection services)
    {
        // Dynamically load the Kiota handlers from the Client Factory
        var kiotaHandlers = KiotaClientFactory.GetDefaultHandlerActivatableTypes();

        // And register them in the DI container
        foreach (var handler in kiotaHandlers)
        {
            services.AddTransient(handler);
        }

        return services;
    }

    // Adds the Kiota handlers to the http client builder.
    public static IHttpClientBuilder AttachKiotaHandlers(this IHttpClientBuilder builder)
    {
        // Dynamically load the Kiota handlers from the Client Factory
        var kiotaHandlers = KiotaClientFactory.GetDefaultHandlerActivatableTypes();

        // And attach them to the http client builder
        foreach (var handler in kiotaHandlers)
        {
            builder.AddHttpMessageHandler((sp) => (DelegatingHandler)sp.GetRequiredService(handler));
        }

        return builder;
    }
}