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

# Developing subgraph

Before developing subgraph code, you must install the [**Graph CLI**](https://github.com/graphprotocol/graph-cli) in order to build and deploy subgraphs. (Please specify version 0.20.1)

```Shell
yarn global add @graphprotocol/graph-cli@0.20.1
or
npm install -g @graphprotocol/graph-cli@0.20.1
```

A subgraph extracts data from a blockchain, processes it, and stores it for easy querying via GraphQL. A qualified subgraph project code should include the following files or directories:

- `subgraph.yaml`: YAML file containing subgraph manifest
- `ABIS`: One or more named ABI files for the source contract and any other smart contracts you interact with in the mapping.
- `schema.graphql` : a GraphQL schema that defines what data is stored for your subgraph, and how to query it via GraphQL
- `AssemblyScript mapping` :  [AssemblyScript](https://github.com/AssemblyScript/assemblyscript) code that translates from the event data to the entities defined in your schema (e.g. `mapping.ts` in this tutorial)

## **The Subgraph Manifest**

The subgraph manifest subgraph.yaml defines the smart contracts your subgraph indexes, which events from these contracts to pay attention to, and how to map event data to entities that graph node stores and allows to query. The full specification for subgraph manifests can be found [**here**](https://github.com/graphprotocol/graph-node/blob/master/docs/subgraph-manifest.md).

For example subgraph, `subgraph.yaml` is:

```YAML
specVersion: 0.0.4
description: Indexing Block data
repository: https://github.com/okx-subgraph/x1-subgraph-example
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum/contract
    name: Submit
    network: xgon
    source:
      address: "0x8F4680F45339b9c93B89D66CA7CfC569DdbbeD79"
      abi: Faucet
      startBlock: 1
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.4
      language: wasm/assemblyscript
      file: ./src/mappings/faucet.ts
      entities:
        - Faucet
      abis:
        - name: Faucet
          file: ./abis/Faucet.json
      eventHandlers:
        - event: SendToken(uint256,uint8,uint8,address,address,uint256,uint256,uint256,bool,bytes)
          handler: handleSendToken
      blockHandlers:
        - handler: handleBlock
```

The important entries to update for the manifest are:

- `description`: a human-readable description of what the subgraph is. This description is displayed by Graph Explorer when the subgraph is deployed to the Hosted Service.
- `repository`: the URL of the repository where the subgraph manifest can be found. This is also displayed by The Graph Explorer.
- `dataSources.source`: the address of the smart contract, the subgraph sources, and the ABI of the smart contract to use. The address is optional; omitting it allows you to index matching events from all contracts.
- `dataSources.source.startBlock`: the optional number of the block that the data source starts indexing from. In most cases, we suggest using the block in which the contract was created.
- `dataSources.mapping.entities`: the entities that the data source writes to the store. The schema for each entity is defined in the schema.graphql file.
- `dataSources.mapping.abis`: one or more named ABI files for the source contract as well as any other smart contracts that you interact with from within the mappings.
- `dataSources.mapping.eventHandlers`: lists the smart contract events this subgraph reacts to and the handlers in the mapping—./src/mapping.ts in the example—that transforms these events into entities in the store.
- `dataSources.mapping.callHandlers`: lists the smart contract functions this subgraph reacts to and handlers in the mapping that transform the inputs and outputs to function calls into entities in the store.
- `dataSources.mapping.blockHandlers`: lists the blocks this subgraph reacts to and handlers in the mapping to run when a block is appended to the chain. Without a filter, the block handler will be run every block. An optional call-filter can be provided by adding a `filter` field with `kind: call` to the handler. This will only run the handler if the block contains at least one call to the data source contract.

A single subgraph can index data from multiple smart contracts. Add an entry for each contract from which data needs to be indexed to the `dataSources` array.

The data source triggers within a block are ordered as follows:

1. Event and call triggers are initially ordered by transaction index within the block.
2. Event and call triggers within the same transaction follow a convention: event triggers precede call triggers, with each type respecting the order defined in the manifest.
3. Block triggers run after event and call triggers, following the order defined in the manifest.

## **Get ABI**

The ABI file must match your contract. There are several ways to get an ABI file:

- If you are building your own project, you can get the latest ABI.
- If you are building a subgraph for a public project, you can download the project to your computer and get ABI by using `truffle compile `, or by using solc for compilation.
- You can also find ABI on [OKLink ](https://www.oklink.com/en), but this is not always reliable because the ABI uploaded there may be out of date. Make sure you have the correct ABI or your subgraph will fail to run.

## **Defining Entities**

Queries will be made against the data model defined in the subgraph schema and the entities indexed by the subgraph. Therefore, it is important to define the subgraph schema to align with the requirements of your dapp. It can be helpful to think of entities as "objects containing data" rather than as events or functions.

With The Graph, you define entity types in schema.graphql, and Graph Node will generate top level fields for querying single instances and collections of that entity type. Each type that should be an entity is required to be annotated with an @entity directive. By default, entities are mutable, meaning that mappings can load existing entities, modify them, and store a new version of that entity. Mutability comes at a price, and for entity types that will never be modified, for example, because they simply contain data extracted verbatim from the chain, it is recommended to mark them as immutable with @entity(immutable: true). Mappings can make changes to immutable entities as long as those changes happen in the same block in which the entity was created. Immutable entities are much faster to write and to query and should therefore be used whenever possible.

### **Example**

The following `Faucet` entities are built around Gravatar objects and are a good example of how to define an entity.

```TypeScript
type Faucet @entity {
    id: ID!
    orderID: String
    receiver: String
    amount: String
    createdAtBlockNumber: BigInt!
}
```

### **Optional and Required Fields**

Entity fields can be defined as required or optional. Required fields are indicated by the `!` in the schema. If a required field is not set in the mapping, you will receive this error when querying the field:

```Plain Text
Null value resolved for non-null field 'name'
```

Each entity must have an `id` field, which must be of type `Bytes!` or `String!`. It is generally recommended to use `Bytes!`, unless the `id` contains human-readable text, since entities with `Bytes!` id's will be faster to write and query as those with a `String!` `id`. The `id` field serves as the primary key, and needs to be unique among all entities of the same type. For historical reasons, the type `ID!` is also accepted and is a synonym for `String!`.

For some entity types the `id` is constructed from the id's of two other entities; that is possible using `concat`, e.g., `let id = left.id.concat(right.id) `to form the id from the id's of `left` and `right`. Similarly, to construct an id from the id of an existing entity and a counter `count`, `let id = left.id.concatI32(count)` be used. The concatenation is guaranteed to produce unique id's as long as the length of the `left` is the same for all such entities, for example, because `left.id` is an `Address`.

## Write mapping

Mappings convert your event data into entities defined in your schema. They are written in a subset of TypeScript known as AssemblyScript, which can be compiled as WASM (WebAssembly). AssemblyScript is stricter than regular TypeScript, but it offers a familiar syntax.

For each event handler defined in subgraph.yaml under mapping.event Handlers, an exported function with the same name should be created. Each handler must accept a single parameter named event, whose type corresponds to the name of the event being handled.

In the example subdiagram, the src/mapping.ts contains handlers for the NewGravatar and UpdateGravatar events:

```TypeScript
import { log,ethereum } from '@graphprotocol/graph-ts'
import { Faucet,Block } from '../types/schema'
import { SendToken } from '../types/Submit/Faucet'

export function handleSendToken(event: SendToken): void {
    let faucet = new Faucet(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
    faucet.orderID = event.params.orderID.toHexString()
    faucet.amount = event.params.amount.toHexString()
    faucet.receiver = event.params.receiver.toHexString()
    faucet.createdAtBlockNumber = event.block.number
    faucet.save();
}
```

The entity is updated to match the new event parameters and saved with faucet.save().

### **Recommended ID for creating new entities**

Every entity has to have an `id` that is unique among all entities of the same type. An entity's `id` value is set when the entity is created. Below are some recommended `id` values to consider when creating new entities. NOTE: The value of `id` must be `string`.

- `event.params.id.toHex()`
- `event.transaction.from.toHex()`
- `event.transaction.hash.toHex() + "-" + event.logIndex.toString()`

We use the [Graph Typescript Library](https://github.com/graphprotocol/graph-ts) which contains utilities for interacting with the Graph Node store and conveniences for handling smart contract data and entities. You can use this library in your mappings by importing `@graphprotocol/graph-ts` into `mapping.ts`.

## Code generation

In order to make it easy and type-safe to work with smart contracts, events and entities, the Graph CLI can generate AssemblyScript types from the subgraph's GraphQL schema and the contract ABIs included in the data sources.

This is done with：

```Shell
graph codegen [--output-dir <OUTPUT_DIR>] [<MANIFEST>]
```

But in most cases, subgraphs have been pre-configured with `package.json `that allow you to simply run one of the following for the same purpose:

```Shell
# Yarn
yarn codegen

# NPM
npm run codegen
```

This will create an AssemblyScript class for each smart contract in the ABI files specified in `subgraph.yaml`. This will enable you to link these contracts to particular addresses in the mappings and execute read-only contract methods against the block being processed. It will also produce a class for each contract event to facilitate access to event parameters, as well as the block and transaction from which the event originated. All of these types are saved to `<OUTPUT_DIR>/<DATA_SOURCE_NAME>/<ABI_NAME>.ts`.

Additionally, a class is created for every entity type in the GraphQL schema of the subgraph. These classes offer type-safe entity loading, read and write access to entity fields, and a `save()` method for writing to the entity to be stored. All entity classes are written to `<OUTPUT_DIR>/schema.ts`, enabling mappings to import them:

```TypeScript
import { Faucet,Block } from '../types/schema'
```

> **Note:** The executable code needs to be regenerated whenever the ABI in the GraphQL model file or manifest changes. It should also be adjusted prior to building or creating partial file diagrams.

If you want to verify before attempting to deploy a subgraph, you can execute `yarn build` and address any syntax errors detected by the TypeScript compilation.

# Deploying subgraph

## Requirements

-  "@graphprotocol/graph-cli": "^0.20.1"
- "@graphprotocol/graph-ts": "^0.20.1"
- "npm": "^7.20.5"

## Step1: upload Subgraph code to Github

**Special notes：**

- If the code repository is private, you must add your X1 Github account subgraph@okx.com. (This step is not necessary for public code repositories)
- Before uploading the subgraph code, please ensure that it has been compiled

## Step2: deploy the Subgraph on the Hosted Service

X1 team will help you with the deployment.

## Deploying suggestions

- Set startBlock to the block in which the smart contract of the data source was created
- Avoid excessive use of data sources to prevent resource consumption.
- Sample：https://github.com/okx-subgraph/x1-subgraph-example

# Querying the Graph

After deploying the subgraph, it takes some time to synchronize the block height before querying becomes possible:

- Query URL ：https://www.okx.com/api/v1/x1-testnet/index/subgraphs/name/<Subgraph_name>
- Query Playground：https://www.okx.com/api/v1/x1-testnet/index/subgraphs/name/<Subgraph_name>/graphql

Please replace `<Subgraph_name>` in the example with your own Subgraph name

## Specification definition of GraphQL language

```GraphQL
query [operationName]([variableName]: [variableType]) {
  [queryName]([argumentName]: [variableName]) {
    # "{ ... }" express a Selection-Set, we are querying fields from `queryName`.
    [field]
    [field]
  }
}
```

While the list of syntactic do's and don'ts is long, here are the essential rules to keep in mind when it comes to writing GraphQL queries:

- Each `queryName` must only be used once per operation.
- Each `field` must be used only once in a selection (we cannot query `id` twice under `token`)
- Some `field`s or queries (like `tokens`) return complex types that require a selection of sub-fields. Not providing a selection when expected (or providing one when not expected - for example, on `id`) will raise an error. 
- Any variable assigned to an argument must match its type.
- In a given list of variables, each of them must be unique.
- All defined variables must be used.

Failing to follow the above rules will end with an error from the Graph API.

## The anatomy of a GraphQL query

Unlike REST API, a GraphQL API is built upon a Schema that defines which queries can be performed.

For example, a query to get a block using the `GetBlocks` query will look as follows:

```GraphQL
query GetBlocks($id: ID!) {
  blocks(id: $id) {
    id
    number
    timestamp
  }
}
```

It will return the following predictable JSON response ( *when passing the correct* *`$id `**variable value* ):

```JSON
{
    "data": {
        "blocks": [
            {
                "id": "...",
                "number": "...",
                "timestamp": "..."
            }
        ]
    }
}
```

### GraphQL API

- When querying a collection, the `orderBy `parameter can be used to sort by specific properties. `orderDirection `can be used to specify the sort
- When querying a collection, you can use the `first `parameter to page from the beginning of the collection. The `skip `parameter can be used to skip entities and pagination.
- When querying a collection, you can use the `where `parameter to filter different properties

example:

```GraphQL
query GetBlocks {
  blocks(
    first: 10
    orderBy: id
    orderDirection: desc
    skip: 10
    where: {number_gt: "7"}
  ) {
    id
    number
    timestamp
  }
}
```

For more features (such as time-travel queries, fulltext search queries), please refer to https://thegraph.com/docs/zh/querying/graphql-api/

### Combine multiple queries

Your application may need to query data for multiple entities, and you can send multiple queries in the same GraphQL request as follows:

```GraphQL
query GetInfo {
  blocks(
    first: 10
    orderBy: id
    orderDirection: desc
    where: {id: "0xffffc9887a687234b1076e3ccfb19d58b19746795ae13a5eea19286d6fc34f0b"}
  ) {
    id
    number
    timestamp
  }
  faucet(first: 10, orderBy: id, orderDirection: asc) {
    id
    receiver
    amount
  }
}
```

## Graph Explorer

Using Graph Explorer will help you query data more easily.Take [X1-faucet-subgraph](https://www.okx.com/api/v1/x1-testnet/index/subgraphs/name/x1-test-faucet/graphql) as an example

1. Click "Explorer" in the upper left corner to expand
<img src="https://github.com/okx-subgraph/x1-subgraph-example/blob/main/docs/images/Explorer.jpg">
2. Select the query entity and filter
<img src="https://github.com/okx-subgraph/x1-subgraph-example/blob/main/docs/images/Filter.jpg">
3. Click this button to get results
<img src="https://github.com/okx-subgraph/x1-subgraph-example/blob/main/docs/images/GetResult.jpg">
  
Query from the application can refer to: https://thegraph.com/docs/zh/querying/querying-from-an-application/

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