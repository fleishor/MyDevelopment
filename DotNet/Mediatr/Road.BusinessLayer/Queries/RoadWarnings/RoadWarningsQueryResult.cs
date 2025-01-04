namespace Road.BusinessLayer.Queries.RoadWarnings
{
    using Road.BusinessLayer.Interfaces.Query;

    public record RoadWarningsQueryResult(List<RoadWarning> RoadWarnings) : IQueryResult;

#pragma warning disable SA1402
    public record RoadWarning(
        string? Identifier,
        string? Subtitle,
        string? Title,
        List<string>? Description,
        string? IsBlocked,
        DateTimeOffset? StartTimestamp);
#pragma warning restore SA1402
}
