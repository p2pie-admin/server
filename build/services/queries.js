"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.citiesQuery = exports.CryptoForCoingeckoQuery = exports.PromptsQuery = exports.ReviewByFingerprintQuery = exports.CreateReviewMutation = exports.ChangeAccuracyMutation = exports.AuthMutation = void 0;
const graphql_request_1 = require("graphql-request");
exports.AuthMutation = (0, graphql_request_1.gql) `
  mutation login {
    login(
      input: {
        identifier: "currency-converter"
        password: "x#@TH4L-#UJ#vq2"
        provider: "local"
      }
    ) {
      jwt
      user {
        username
        email
      }
    }
  }
`;
exports.ChangeAccuracyMutation = (0, graphql_request_1.gql) `
  mutation UpdateCurrency($id: ID!, $accuracy: Int) {
    updateCurrency(id: $id, data: { accuracy: $accuracy }) {
      data {
        id
        attributes {
          code
          accuracy
        }
      }
    }
  }
`;
exports.CreateReviewMutation = (0, graphql_request_1.gql) `
  mutation CreateReview($data: ReviewInput!) {
    createReview(data: $data) {
      data {
        id
        attributes {
          ai_data
        }
      }
    }
  }
`;
exports.ReviewByFingerprintQuery = (0, graphql_request_1.gql) `
  query ReviewByFingerprint($fingerprint: String, $limit: Int) {
    reviews(
      filters: { fingerprint: { eq: $fingerprint } }
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          ai_data
        }
      }
    }
  }
`;
exports.PromptsQuery = (0, graphql_request_1.gql) `
  {
    prompts(pagination: { limit: 2000 }) {
      data {
        id
        attributes {
          code
          description
        }
      }
    }
  }
`;
exports.CryptoForCoingeckoQuery = (0, graphql_request_1.gql) `
  {
    selector {
      data {
        attributes {
          sections(filters: { en_title: { contains: "rypto" } }) {
            pm_groups(pagination: { start: 0, limit: 1000 }) {
              data {
                id
                attributes {
                  en_name
                  options {
                    ... on ComponentSelectorCurrency {
                      currency {
                        data {
                          id
                          attributes {
                            code
                          }
                        }
                      }
                    }
                    ... on ComponentSelectorSubgroup {
                      currency {
                        data {
                          id
                          attributes {
                            code
                            accuracy
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
exports.citiesQuery = (0, graphql_request_1.gql) `
  {
    parserSetting {
      data {
        attributes {
          cities
        }
      }
    }
  }
`;
