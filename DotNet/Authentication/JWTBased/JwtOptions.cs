namespace JWTBased
{
    public class JwtOptions
    {
        public string Issuer { get; set; } = "issuer";

        public string Audience { get; set; } = "audience";

        public string SecretKey { get; set; } = "secretKey";

        public int ExpirationTimeInSeconds { get; set; } = 3600;
    }
}
