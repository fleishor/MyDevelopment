using Bund.API.Autobahn.Client;
using Library.Interfaces;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;

namespace Library.Queries
{
    public class TrafficQueryHandler : IQueryHandler<TrafficQuery, TrafficQueryResult>
    {
        public async Task<TrafficQueryResult> Handle(TrafficQuery queryParameters, CancellationToken cancellationToken)
        {
            var authProvider = new AnonymousAuthenticationProvider();
            var adapter = new HttpClientRequestAdapter(authProvider);
            var client = new AutobahnClientApi(adapter);

            var allRoads = await client.GetAsync(cancellationToken: cancellationToken);

            var roadIds = allRoads!.RoadsProp!.ToArray();

            return new TrafficQueryResult(roadIds);
        }
    }
}
