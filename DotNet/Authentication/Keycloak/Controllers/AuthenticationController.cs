using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Keycloak;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace JWTBased.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthenticationController : ControllerBase
{
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly KeycloakOptions jwtOptions;

    public AuthenticationController(IHttpContextAccessor httpContextAccessor,
        IOptions<KeycloakOptions> jwtOptions)
    {
        this.httpContextAccessor = httpContextAccessor;
        this.jwtOptions = jwtOptions.Value;
    }

    [AllowAnonymous]
    [HttpGet("SignIn")]
    public string SignIn(CancellationToken cancellationToken)
    {
        return string.Empty;
    }

    [AllowAnonymous]
    [HttpGet("GetIdentity")]
    public string GetIdentity(CancellationToken cancellationToken)
    {
        if (httpContextAccessor.HttpContext != null)
        {
            var result = httpContextAccessor.HttpContext.User.Identities.Select(identity => new
            {
                identity.IsAuthenticated,
                identity.AuthenticationType,
                identity.Name,
                Claims = identity.Claims.Select(claim => new
                {
                    claim.Type,
                    claim.Value
                })
            });

            return JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true });
        }

        return string.Empty;
    }

}
