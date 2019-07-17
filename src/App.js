import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Organization from "./Organization";

const axiosGitHubGraphQL = axios.create({
    baseURL: 'https://api.github.com/graphql',
    headers: {
        Authorization: `bearer ${process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN}`
    }
});

const TITLE = 'React GraphQL GitHub Client';

//GraphQL parts
const GET_ISSUES_OF_REPOSITORY = `query($organization: String!, $repository: String!, $cursor: String) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        stargazers {
          totalCount
        }
        viewerHasStarred
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const ADD_STAR = `
  mutation ($repositoryId: ID!) {
    addStar(input:{starrableId:$repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

const REMOVE_STAR = `
  mutation ($repositoryId: ID!) {
    removeStar(input:{starrableId:$repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

// Requests
const addStarToRepository = repositoryId => {
    return axiosGitHubGraphQL.post('', {
        query: ADD_STAR,
        variables: {repositoryId},
    });
};

const removeStarToRepository = repositoryId => {
    return axiosGitHubGraphQL.post('', {
        query: REMOVE_STAR,
        variables: {repositoryId},
    });
};

const getIssuesOfRepository = (path, cursor) => {
    const [organization, repository] = path.split('/');
    return axiosGitHubGraphQL.post('', {
        query: GET_ISSUES_OF_REPOSITORY,
        variables: {organization, repository, cursor},
    });
};

// Component
const INITIAL_STATE = {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null
};

const App = () => {
    const [org, setOrg] = useState(INITIAL_STATE);
    const {path, organization, errors} = org;

    const onSubmit = event => {
        event.preventDefault();
        onFetchFromGitHub();
    };

    const onChange = event => {
        setOrg({...org, path: event.target.value});
    };

    const onStarRepository = (repositoryId, viewerHasStarred) => {
        viewerHasStarred ?
            removeStarToRepository(repositoryId).then(mutationResult =>
                setOrg({
                    ...org,
                    organization: {
                        ...org.organization,
                        repository: {
                            ...org.organization.repository,
                            viewerHasStarred: false,
                            stargazers: {
                                totalCount: organization.repository.stargazers.totalCount - 1,
                            }
                        },
                    },
                })
            )
            :
            addStarToRepository(repositoryId).then(mutationResult =>
                setOrg({
                    ...org,
                    organization: {
                        ...org.organization,
                        repository: {
                            ...org.organization.repository,
                            viewerHasStarred: true,
                            stargazers: {
                                totalCount: organization.repository.stargazers.totalCount + 1,
                            }
                        },
                    },
                })
            );
    };

    const onFetchFromGitHub = (cursor) => {
        getIssuesOfRepository(path, cursor).then(result => setOrg({
            ...org,
            organization: result.data.data.organization,
            errors: result.data.errors
        }))
    };

    const onFetchMoreIssues = () => {
        const {endCursor} = organization.repository.issues.pageInfo;
        onFetchFromGitHub(endCursor);
    };

    useEffect(() => {
        // If i place here 'onFetchFromGitHub' function it would be a exhaustive-deps warning,
        // cz function recreating on every update.
        // Just don't want to put it out from component
        // or, in other case, to do some magic with useCallback and other hooks...
        getIssuesOfRepository(INITIAL_STATE.path).then(result => setOrg({
            path: INITIAL_STATE.path,
            organization: result.data.data.organization,
            errors: result.data.errors
        }))
    }, []);

    return <>
        <h1>{TITLE}</h1>
        <form onSubmit={onSubmit}>
            <label htmlFor="url">
                Show open issues for https://github.com/
            </label>
            <input
                id="url"
                type="text"
                value={path}
                onChange={onChange}
                style={{width: '300px'}}
            />
            <button type="submit">Search</button>
        </form>

        <hr/>

        {organization ? (
            <Organization organization={organization} errors={errors} onFetchMoreIssues={onFetchMoreIssues}
                          onStarRepository={onStarRepository}/>
        ) : (
            <p>No information yet ...</p>
        )}
    </>
};

export default App;
