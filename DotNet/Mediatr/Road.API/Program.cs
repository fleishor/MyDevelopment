namespace Road.API;

using FluentValidation;
using Road.BusinessLayer;
using Road.BusinessLayer.Behaviors.Query;
using Road.BusinessLayer.Queries.RoadWarnings;

public static class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        builder.Services.AddControllers();

        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        builder.Services.AddValidatorsFromAssembly(typeof(RoadWarningsQueryHandler).Assembly);

        builder.Services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(RoadWarningsQueryHandler).Assembly);

            // Order of AddOpenBehavior() is important
            cfg.AddOpenBehavior(typeof(QueryLoggingBehavior<,>));
            cfg.AddOpenBehavior(typeof(QueryValidationBehavior<,>));
            cfg.AddOpenBehavior(typeof(QueryCachingBehavior<,>));
        });

        // Add Kiota handlers to the dependency injection container
        builder.Services.AddKiotaHandlers();

        // Register the factory for the Autobahn client
        builder.Services
            .AddHttpClient<AutobahnClientFactory>(
                (_, client) =>
                {
                    client.DefaultRequestHeaders.Add("Accept", "application/json");
                })

            // Attach the Kiota handlers to the http client, this is to enable all the Kiota features.
            .AttachKiotaHandlers();

        // Register the Autobahn client
        builder.Services.AddTransient(sp => sp.GetRequiredService<AutobahnClientFactory>().GetClient());

        builder.Services.AddMemoryCache();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseAuthorization();

        app.MapControllers();

        app.Run();
    }
}
