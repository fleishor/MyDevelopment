namespace Road.BusinessLayer.Interfaces.Query
{
    public interface ICacheable
    {
        string CacheKey { get; }

        int SlidingExpirationInMinutes { get; }
    }
}
