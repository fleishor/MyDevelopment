namespace Road.API.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
public class AuthenticationController(
    IHttpContextAccessor ctx,
    ILogger<AuthenticationController> logger) : ControllerBase
{
    [HttpGet("SignIn")]
    public async Task<string> SignIn(CancellationToken cancellationToken)
    {
        var claims = new List<Claim>() { new Claim("user", "fleishor") };
        var identity = new ClaimsIdentity(claims, "cookie");
        var user = new ClaimsPrincipal(identity);
        if (ctx.HttpContext != null)
        {
            await ctx.HttpContext.SignInAsync("cookie", user);
        }

        return "ok";
    }

    [HttpGet("GetIdentity")]
    public string GetIdentity(CancellationToken cancellationToken)
    {
        if (ctx.HttpContext != null)
        {
            return ctx.HttpContext.User.Claims.ToList().ToString();
        }

        return string.Empty;
    }

}
