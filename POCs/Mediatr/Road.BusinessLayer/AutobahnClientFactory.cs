namespace Road.BusinessLayer;

using Bund.API.Autobahn.Client;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;

public class AutobahnClientFactory(HttpClient httpClient)
{
    private readonly IAuthenticationProvider authenticationProvider = new AnonymousAuthenticationProvider();

    public AutobahnClient GetClient()
    {
        var clientRequestAdapter = new HttpClientRequestAdapter(this.authenticationProvider, httpClient: httpClient);
        return new AutobahnClient(clientRequestAdapter);
    }
}