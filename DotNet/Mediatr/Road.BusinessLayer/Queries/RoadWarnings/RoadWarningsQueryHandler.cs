namespace Road.BusinessLayer.Queries.RoadWarnings
{
    using System.Linq;
    using Bund.API.Autobahn.Client;
    using Microsoft.Extensions.Logging;
    using Road.BusinessLayer.Interfaces.Query;

    public class RoadWarningsQueryHandler(
        AutobahnClient autobahnClient,
        ILogger<RoadWarningsQueryHandler> logger)
        : IQueryHandler<RoadWarningsQuery, RoadWarningsQueryResult>
    {
        public async Task<RoadWarningsQueryResult> Handle(RoadWarningsQuery queryParameters, CancellationToken cancellationToken)
        {
            logger.LogInformation("Get road warnings for highway {RoadId}", queryParameters.RoadId);
            var warningsForARoad = await autobahnClient[queryParameters.RoadId].Services.Warning.GetAsync(cancellationToken: cancellationToken);

            var warnings = warningsForARoad?.Warning?.ToList();
            if (warnings == null)
            {
                logger.LogInformation("No road warnings for highway {RoadId} found", queryParameters.RoadId);
                return new RoadWarningsQueryResult([]);
            }

            logger.LogInformation("{WarningsCount} road warnings for highway {RoadId} found", warnings.Count, queryParameters.RoadId);
            var roadWarnings = warnings.Select(warning => new RoadWarning(
                                                                warning.Identifier,
                                                                warning.Subtitle,
                                                                warning.Title,
                                                                warning.Description,
                                                                warning.IsBlocked,
                                                                warning.StartTimestamp))
                                       .ToList();

            return new RoadWarningsQueryResult(roadWarnings);
        }
    }
}
