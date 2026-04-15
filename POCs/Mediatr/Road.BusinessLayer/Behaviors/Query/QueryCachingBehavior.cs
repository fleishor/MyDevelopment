namespace Road.BusinessLayer.Behaviors.Query;

using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Road.BusinessLayer.Interfaces.Query;

public class QueryCachingBehavior<TQuery, TQueryResult>(
        ILogger<QueryCachingBehavior<TQuery, TQueryResult>> logger,
        IMemoryCache cache)
    : IPipelineBehavior<TQuery, TQueryResult>
        where TQuery : IQuery<IQueryResult>, ICacheable
{
    public async Task<TQueryResult> Handle(TQuery request, RequestHandlerDelegate<TQueryResult> next, CancellationToken cancellationToken)
    {
        logger.LogInformation("Checking MemoryCache; CacheKey: \"{CacheKey}\"", request.CacheKey);

        TQueryResult response;
        if (cache.Get(request.CacheKey) is string cachedResponse)
        {
            response = JsonSerializer.Deserialize<TQueryResult>(cachedResponse)!;
            logger.LogInformation("Fetched from cache; CacheKey: \"{CacheKey}\"", request.CacheKey);
        }
        else
        {
            response = await this.GetResponseAndAddToCache(request, next);
            logger.LogInformation("Added to cache; CacheKey: \"{CacheKey}\"", request.CacheKey);
        }

        return response;
    }

    private async Task<TQueryResult> GetResponseAndAddToCache(TQuery request, RequestHandlerDelegate<TQueryResult> next)
    {
        var response = await next();
        if (response is not null)
        {
            var slidingExpirationInMinutes = request.SlidingExpirationInMinutes == 0 ? 30 : request.SlidingExpirationInMinutes;
            var options = new MemoryCacheEntryOptions().SetSlidingExpiration(TimeSpan.FromMinutes(slidingExpirationInMinutes));

            var serializedData = JsonSerializer.Serialize(response);
            cache.Set(request.CacheKey, serializedData, options);
        }

        return response;
    }
}
