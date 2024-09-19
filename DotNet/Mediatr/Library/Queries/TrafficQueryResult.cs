using Library.Interfaces;

namespace Library.Queries
{
    public record TrafficQueryResult(string[] RoadIds) : IQueryResult
    {
    }
}
