# Quick start

This guide will show you how to quickly initialize, create, and deploy your subgraph with X1's Subgraph service. By deploying the subgraph, you can explore the subgraph GraphQL API by issuing queries and viewing the schema.

The X1 testnet currently provides a **beta version** of the Subgraph **Hosted Service**. To deploy a subgraph on this service, please send your application to subgraph@okx.com and include the following information:

| **Information**                                              | **Sample**                                  |
| ------------------------------------------------------------ | ------------------------------------------- |
| Name of project                                              | X1 Test Project                             |
| Official website (if any)                                    | https://github.com/x1testproject            |
| Github (if any)                                              |                                             |
| Type of project                                              | DeFi，GameFi，NFT...                        |
| Introduction to project                                      | x1testproject is an AMM swap                |
| Uses of the Subgraph service                                 | Query business data and present it to users |
| Special requirements for Subgraph services (e.g., QPS, please specify if any) | QPS > 100                                   |
| Way of contacting you (please provide Telegram/Discord contact information.) | @x1testproject                              |
| Expected subgraph name                                       | x1testproject-statistics-v1                 |

# FAQ

## What is a subgraph?

A subgraph is a specialized API created for blockchain data. Subgraphs are accessed using the GraphQL query language and are deployed to a Graph node using the Graph CLI. Once deployed and made public, subgraphs can be queried by subgraph consumers.

## Are there requirements for subgraph code？

- "@graphprotocol/graph-cli": "^0.20.1"
- "@graphprotocol/graph-ts": "^0.20.1"
- "npm": "^7.20.5"ß

## Is it not possible to deploy subgraphs with the same name.?

Duplicate subgraph names are not allowed.

## Can I delete my subgraph?

Yes. You may contact the X1 support team to do that for you.

## Does the deployed subgraph support modifications or upgrades？

Yes. You may contact the X1 support team for further help.

## What are the limitations when querying the subgraph?

There will be a query limit. If you encounter restricted flow or no response to the query, please reach out to the X1 support team.

## Do I need to pay for querying the subgraph?

Free for now.

>Join our [Discord server](https://discord.gg/x1-network) and navigate to _#dev-support_ to contact X1 tech support staff with your requests