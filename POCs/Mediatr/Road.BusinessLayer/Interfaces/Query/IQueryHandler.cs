namespace Road.BusinessLayer.Interfaces.Query
{
    using MediatR;

    public interface IQueryHandler<in TQueryArguments, TQueryResult> :
        IRequestHandler<TQueryArguments, TQueryResult>
        where TQueryArguments : IQuery<IQueryResult>, IRequest<TQueryResult>
    {
    }
}