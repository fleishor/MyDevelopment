using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace JWTBased
{
    public class JwtConfigureOptions : IConfigureOptions<JwtOptions>
    {
        private readonly IConfiguration configuration;

        public JwtConfigureOptions(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        public void Configure(JwtOptions options)
        {
            configuration.GetSection("JwtOptions").Bind(options);
        }
    }
}
