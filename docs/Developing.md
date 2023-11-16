# development manual

## **overview**

Before subgraph code development, you need to install the [Graph CLI ](https://github.com/graphprotocol/graph-cli)to build and deploy subgraphs. (Please specify version 0.20.1)

```TypeScript
yarn global add @graphprotocol/graph-cli@0.20.1
or
npm install -g @graphprotocol/graph-cli@0.20.1
```

A subgraph extracts data from a blockchain, processing it and storing it so that it can be easily queried via GraphQL.

A qualified subgraph project code should include the following files or directories:

- `subgraph.yaml`: YAML file containing subgraph manifest
- `ABIS`: One or more named ABI files for the source contract and any other smart contracts you interact with in the mapping.
- `schema.graphql` : a GraphQL schema that defines what data is stored for your subgraph, and how to query it via GraphQL
- `AssemblyScript mapping` :  [AssemblyScript](https://github.com/AssemblyScript/assemblyscript) code that translates from the event data to the entities defined in your schema (e.g. `mapping.ts` in this tutorial)

Below we will describe the development details of these files in detail

## **The Subgraph Manifest**

The subgraph manifest `subgraph.yaml` defines the smart contracts your subgraph indexes, which events from these contracts to pay attention to, and how to map event data to entities that Graph Node stores and allows to query. The full specification for subgraph manifests can be found [here](https://github.com/graphprotocol/graph-node/blob/master/docs/subgraph-manifest.md).

For example subgraph, `subgraph.yaml` is:

```TypeScript
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

- `description`: a human-readable description of what the subgraph is. This description is displayed by the Graph Explorer when the subgraph is deployed to the Hosted Service.
- `repository`: the URL of the repository where the subgraph manifest can be found. This is also displayed by The Graph Explorer.
- `dataSources.source`: the address of the smart contract the subgraph sources, and the ABI of the smart contract to use. The address is optional; omitting it allows you to index matching events from all contracts.
- `dataSources.source.startBlock`: the optional number of the block that the data source starts indexing from. In most cases, we suggest using the block in which the contract was created.
- `dataSources.mapping.entities`: the entities that the data source writes to the store. The schema for each entity is defined in the schema.graphql file.
- `dataSources.mapping.abis`: one or more named ABI files for the source contract as well as any other smart contracts that you interact with from within the mappings.
- `dataSources.mapping.eventHandlers`: lists the smart contract events this subgraph reacts to and the handlers in the mapping—./src/mapping.ts in the example—that transform these events into entities in the store.
- `dataSources.mapping.callHandlers`: lists the smart contract functions this subgraph reacts to and handlers in the mapping that transform the inputs and outputs to function calls into entities in the store.
- `dataSources.mapping.blockHandlers`: lists the blocks this subgraph reacts to and handlers in the mapping to run when a block is appended to the chain. Without a filter, the block handler will be run every block. An optional call-filter can be provided by adding a `filter` field with `kind: call` to the handler. This will only run the handler if the block contains at least one call to the data source contract.

A single subgraph can index data from multiple smart contracts. Add an entry for each contract from which data needs to be indexed to the `dataSources` array.

The triggers for a data source within a block are ordered using the following process:

1. Event and call triggers are first ordered by transaction index within the block.
2. Event and call triggers within the same transaction are ordered using a convention: event triggers first then call triggers, each type respecting the order they are defined in the manifest.
3. Block triggers run after event and call triggers, in the order they are defined in the manifest.

These ordering rules are subject to change.

## **Get ABI**

ABI file must match your contract. There are several ways to get an ABI file:

- If you are building your own project, you can get the latest ABI.
- If you are building a subgraph for a public project, you can download the project to your computer and get ABI by using `truffle compile `, or by using solc for compilation.
- You can also find ABI on [OKLink ](https://www.oklink.com/en), but this is not always reliable because the ABI uploaded there may be out of date. Make sure you have the correct ABI or your subgraph will fail to run.

## **Defining Entities**

All queries will be made against the data model defined in the subgraph schema and the entities indexed by the subgraph. Because of this, it is good to define the subgraph schema in a way that matches the needs of your dapp. It may be useful to imagine entities as "objects containing data", rather than as events or functions.

With The Graph, you simply define entity types in `schema.graphql`, and Graph Node will generate top level fields for querying single instances and collections of that entity type. Each type that should be an entity is required to be annotated with an `@entity` directive. By default, entities are mutable, meaning that mappings can load existing entities, modify them and store a new version of that entity. Mutability comes at a price, and for entity types for which it is known that they will never be modified, for example, because they simply contain data extracted verbatim from the chain, it is recommended to mark them as immutable with `@entity(immutable: true)`. Mappings can make changes to immutable entities as long as those changes happen in the same block in which the entity was created. Immutable entities are much faster to write and to query, and should therefore be used whenever possible.

### **Examples of good code**

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

```Plaintext
Null value resolved for non-null field 'name'
```

Each entity must have an `id` field, which must be of type `Bytes!` or `String!`. It is generally recommended to use `Bytes!`, unless the `id` contains human-readable text, since entities with `Bytes!` id's will be faster to write and query as those with a `String!` `id`. The `id` field serves as the primary key, and needs to be unique among all entities of the same type. For historical reasons, the type `ID!` is also accepted and is a synonym for `String!`.

For some entity types the `id` is constructed from the id's of two other entities; that is possible using `concat`, e.g., `let id = left.id.concat(right.id) `to form the id from the id's of `left` and `right`. Similarly, to construct an id from the id of an existing entity and a counter `count`, `let id = left.id.concatI32(count)` can be used. The concatenation is guaranteed to produce unique id's as long as the length of `left` is the same for all such entities, for example, because `left.id` is an `Address`.

## **write mapping**

Mappings convert your event data into entities defined in your schema. Mappings are written in a subset of TypeScript called AssemblyScript, which can be compiled as WASM (WebAssembly). AssemblyScript is stricter than regular TypeScript, but provides a familiar syntax.

For each event handler defined in subgraph.yaml under mapping.event Handlers, create an exported function with the same name. Each handler must accept a single parameter named event whose type corresponds to the name of the event being handled.

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

We use the [Graph Typescript Library](https://github.com/graphprotocol/graph-ts) which contains utilies for interacting with the Graph Node store and conveniences for handling smart contract data and entities. You can use this library in your mappings by importing `@graphprotocol/graph-ts` in `mapping.ts`.

## **other**

### **code generation**

In order to make it easy and type-safe to work with smart contracts, events and entities, the Graph CLI can generate AssemblyScript types from the subgraph's GraphQL schema and the contract ABIs included in the data sources.

This is done with

```TypeScript
graph codegen [--output-dir <OUTPUT_DIR>] [<MANIFEST>]
```

But in most cases, subgraphs have been pre-configured with `package.json `that allow you to simply run one of the following for the same purpose:

```Shell
# Yarn
yarn codegen

# NPM
npm run codegen
```

This will generate an AssemblyScript class for every smart contract in the ABI files mentioned in `subgraph.yaml`, allowing you to bind these contracts to specific addresses in the mappings and call read-only contract methods against the block being processed. It will also generate a class for every contract event to provide easy access to event parameters, as well as the block and transaction the event originated from. All of these types are written to `<OUTPUT_DIR>/<DATA_SOURCE_NAME>/<ABI_NAME>.ts`. 

In addition to this, a class is generated for each entity type in the GraphQL schema of the subgraph. These classes provide type-safe entity loading, read and write access to entity fields, and a `save () `method to write to the entity to be stored. All entity classes write `< OUTPUT_DIR >/schema.ts `, allowing mappings to import them

```TypeScript
import { Faucet,Block } from '../types/schema'
```

> **Note: The** executable code must be re-generated each time the ABI contained in the GraphQL model file or manifest is changed. It must also be modified before building or partial file diagrams.

If you want to check before trying to deploy a subgraph, you can run `yarn build `and fix any syntax errors that the TypeScript compilation might find