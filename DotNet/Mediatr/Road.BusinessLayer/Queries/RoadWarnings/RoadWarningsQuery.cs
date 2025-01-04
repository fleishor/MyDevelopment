namespace Road.BusinessLayer.Queries.RoadWarnings
{
    using Road.BusinessLayer.Interfaces.Query;

    public record RoadWarningsQuery(string RoadId, int SlidingExpirationInMinutes = 0) : IQuery<RoadWarningsQueryResult>, ICacheable
    {
        public string CacheKey { get; } = RoadId;

        public int SlidingExpirationInMinutes { get; } = SlidingExpirationInMinutes;
    }
}
