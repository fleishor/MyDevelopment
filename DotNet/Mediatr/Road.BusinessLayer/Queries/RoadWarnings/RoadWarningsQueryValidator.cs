namespace Road.BusinessLayer.Queries.RoadWarnings;

using FluentValidation;

public class RoadWarningsQueryValidator : AbstractValidator<RoadWarningsQuery>
{
    public RoadWarningsQueryValidator()
    {
        RuleFor(x => x.RoadId).NotEmpty().MaximumLength(4);
    }
}