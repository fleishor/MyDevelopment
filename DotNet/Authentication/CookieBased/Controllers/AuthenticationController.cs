using Microsoft.AspNetCore.Authorization;

namespace CookieBased.Controllers;

using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
public class AuthenticationController(IHttpContextAccessor ctx) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("SignIn")]
    public async Task<string> SignIn(CancellationToken cancellationToken)
    {
        var claims = new List<Claim>()
        {
            new Claim("user", "fleishor"),
            new Claim(ClaimTypes.Email, "fleishor@fleishor.org"),
            new Claim(ClaimTypes.Name, "FleisHor"),
            new Claim(ClaimTypes.Role, "HelloWorldRole")
        };
        var identity = new ClaimsIdentity(claims, Program.AuthenticationScheme);
        var user = new ClaimsPrincipal(identity);
        if (ctx.HttpContext != null)
        {
            await ctx.HttpContext.SignInAsync(Program.AuthenticationScheme, user);
        }

        return "ok";
    }

    [AllowAnonymous]
    [HttpGet("GetIdentity")]
    public string GetIdentity(CancellationToken cancellationToken)
    {
        if (ctx.HttpContext != null)
        {
            var result = ctx.HttpContext.User.Identities.Select(identity => new
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
