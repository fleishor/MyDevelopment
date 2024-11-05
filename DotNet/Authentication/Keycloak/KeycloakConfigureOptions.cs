using System.Text;
using Keycloak;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace JWTBased
{
    public class KeycloakConfigureOptions : IConfigureOptions<KeycloakOptions>
    {
        private readonly IConfiguration configuration;

        public KeycloakConfigureOptions(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        public void Configure(KeycloakOptions options)
        {
            configuration.GetSection("JwtOptions").Bind(options);
        }
    }
}
