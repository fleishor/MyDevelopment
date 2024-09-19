using Library;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Library.Queries;

namespace API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TrafficController : ControllerBase
    {
        private readonly ILogger<TrafficController> _logger;
        private readonly IMediator _mediator;

        public TrafficController(
            IMediator mediator,
            ILogger<TrafficController> logger)
        {
            _logger = logger;
            _mediator = mediator;
        }

        [HttpGet(Name = "GetWeatherData")]
        public async Task<TrafficQueryResult> Get(CancellationToken cancellationToken)
        {
            var weatherDataQueryParameters = new TrafficQuery("abc");
            var result = await this._mediator.Send(weatherDataQueryParameters, cancellationToken);

            return result;
        }
    }
}
