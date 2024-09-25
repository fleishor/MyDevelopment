namespace Road.API.Controllers
{
    using MediatR;
    using Microsoft.AspNetCore.Mvc;
    using Road.BusinessLayer.Queries.RoadWarnings;

    [ApiController]
    [Route("[controller]")]
    public class RoadController(IMediator mediator) : ControllerBase
    {
        [HttpGet("GetRoadWarnings/{roadId}")]
        public async Task<RoadWarningsQueryResult> GetRoadWarnings(string roadId, CancellationToken cancellationToken)
        {
            var roadWarningsQuery = new RoadWarningsQuery(roadId.ToUpper(), SlidingExpirationInMinutes: 1);
            var result = await mediator.Send(roadWarningsQuery, cancellationToken);

            return result;
        }
    }
}
