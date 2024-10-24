using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
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
    private readonly JwtOptions jwtOptions;

    public AuthenticationController(IHttpContextAccessor httpContextAccessor,
        IOptions<JwtOptions> jwtOptions)
    {
        this.httpContextAccessor = httpContextAccessor;
        this.jwtOptions = jwtOptions.Value;
    }

    [AllowAnonymous]
    [HttpGet("SignIn")]
    public string SignIn(CancellationToken cancellationToken)
    {
        var claims = new List<Claim>()
        {
            new Claim(JwtRegisteredClaimNames.Sub, new Guid().ToString()),
            new Claim(JwtRegisteredClaimNames.Email, "fleishor@fleishor.org"),
            new Claim(JwtRegisteredClaimNames.Name, "FleisHor"),
            new Claim("Role", "HelloWorldRole")
        };

        var signingCredentials = new SigningCredentials(
                                    new SymmetricSecurityKey(
                                        Encoding.UTF8.GetBytes(this.jwtOptions.SecretKey)
                                        ),
                                    SecurityAlgorithms.HmacSha256Signature);

        var jwtToken = new JwtSecurityToken(
            this.jwtOptions.Issuer,
            this.jwtOptions.Audience,
            claims,
            DateTime.Now,
            DateTime.Now.AddSeconds(this.jwtOptions.ExpirationTimeInSeconds),
            signingCredentials);

        var jwtTokenValue = new JwtSecurityTokenHandler().WriteToken(jwtToken);

        return jwtTokenValue;
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
