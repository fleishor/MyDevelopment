namespace Road.API.Controllers
{
    using MediatR;
    using Microsoft.AspNetCore.Mvc;
    using Road.BusinessLayer.Queries.RoadWarnings;

    [ApiController]
    [Route("[controller]")]
    public class RoadController(
        IMediator mediator,
        ILogger<RoadController> logger) : ControllerBase
    {
        [HttpGet("GetRoadWarnings/{roadId}")]
        public async Task<RoadWarningsQueryResult> GetRoadWarnings(string roadId, CancellationToken cancellationToken)
        {
            using var loggerScope = logger.BeginScope("Get road warnings for highway {RoadId}", roadId);

            var roadWarningsQuery = new RoadWarningsQuery(roadId.ToUpper(), SlidingExpirationInMinutes: 1);
            var result = await mediator.Send(roadWarningsQuery, cancellationToken);

            return result;
        }
    }
}
