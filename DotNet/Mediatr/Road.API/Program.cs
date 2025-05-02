using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace Road.API;

using FluentValidation;
using Microsoft.AspNetCore.HttpLogging;
using Road.Api;
using Road.BusinessLayer;
using Road.BusinessLayer.Behaviors.Query;
using Road.BusinessLayer.Queries.RoadWarnings;
using Serilog;
using Serilog.HttpClient.Extensions;

public static class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add Serilog and use configuration from appsettings.json
        builder.Host.UseSerilog((context, config) =>
        {
            config.ReadFrom.Configuration(context.Configuration)

                // necessary for Serilog.LogRequestResponse
                .AddJsonDestructuringPolicies();
        });

        builder.Services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService("Road.API"))
            .WithTracing(tracing =>
            {
                tracing.AddHttpClientInstrumentation()
                       .AddAspNetCoreInstrumentation();
                tracing.AddOtlpExporter();
            });

        // Required by ClientInfo enricher
        builder.Services.AddHttpContextAccessor();

        // Add Cookie Authorization
        builder.Services.AddAuthentication("cookie").AddCookie("cookie");

        // Add HttpLogging, but may cause performance issues
        builder.Services.AddHttpLogging(options =>
        {
            options.LoggingFields = HttpLoggingFields.RequestPropertiesAndHeaders | HttpLoggingFields.ResponsePropertiesAndHeaders;
            options.RequestHeaders.Add("x-correlation-id");
            options.CombineLogs = false;
        });

        // Add services to the container.
        builder.Services.AddControllers();

        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(config =>
        {
            // Add CorrelationId to SwaggerUI
            config.OperationFilter<AddHeaderParameters>();
        });

        // Add FluentValidators
        builder.Services.AddValidatorsFromAssembly(typeof(RoadWarningsQueryHandler).Assembly);

        // Add MediatR
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
            .AttachKiotaHandlers()
            .LogRequestResponse();

        // Register the Autobahn client
        builder.Services.AddTransient(sp => sp.GetRequiredService<AutobahnClientFactory>().GetClient());

        // Add MemoryCache
        builder.Services.AddMemoryCache();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        app.UseSwagger();
        app.UseSwaggerUI();

        app.UseAuthentication();
        app.UseAuthorization();
        app.UseStaticFiles();

        // Log also ASP.Net request to Serilog
        app.UseSerilogRequestLogging();

        // Log also HTTP to Serilog, static files are excluded because it called after UseStaticFiles()
        // But may cause performance issues
        app.UseHttpLogging();

        app.MapControllers();

        app.Run();
    }
}
