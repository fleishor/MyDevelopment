using Library.Interfaces;
using MediatR;

namespace Library.Queries
{
    public record TrafficQuery(string RoadId) : IQuery<TrafficQueryResult>;
}
