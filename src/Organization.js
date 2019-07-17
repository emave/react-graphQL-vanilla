import React from 'react';

const Organization = ({organization, errors, onFetchMoreIssues, onStarRepository}) => {
    if(errors) {
        return <p>
            <strong>Something went wrong:</strong>
            {errors.map(error => error.message).join(' ')}
        </p>
    }
    return <div>
        <p>
            <strong>Issues from Organization:</strong>
            <a href={organization.url}>{organization.name}</a>
        </p>
        <Repository repository={organization.repository} onFetchMoreIssues={onFetchMoreIssues} onStarRepository={onStarRepository}/>
    </div>
};

const Repository = ({ repository, onFetchMoreIssues, onStarRepository }) => (
    <div>
        <p>
            <strong>In Repository:</strong>
            <a href={repository.url}>{repository.name}</a>
        </p>

        <button
            type="button"
            onClick={() => onStarRepository(repository.id, repository.viewerHasStarred)}
        >
            {repository.stargazers.totalCount}
            {repository.viewerHasStarred ? 'Unstar' : 'Star'}
        </button>

        <ul>
            {repository.issues.edges.map(issue => (
                <li key={issue.node.id}>
                    <a href={issue.node.url}>{issue.node.title}</a>

                    <ul>
                        {issue.node.reactions.edges.map(reaction => (
                            <li key={reaction.node.id}>{reaction.node.content}</li>
                        ))}
                    </ul>
                </li>
            ))}
        </ul>
        {repository.issues.pageInfo.hasNextPage && <button onClick={onFetchMoreIssues}>More</button>}
    </div>
);

export default Organization;