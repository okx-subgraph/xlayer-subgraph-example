import { log,ethereum } from '@graphprotocol/graph-ts'
import { Faucet,Block } from '../types/schema'
import { SendToken } from '../types/Submit/Faucet'

export function handleSendToken(event: SendToken): void {
    let faucet = new Faucet(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
    faucet.orderID = event.params.orderID.toString()
    faucet.amount = event.params.amount.toString()
    faucet.receiver = event.params.receiver.toString()
    faucet.createdAtBlockNumber = event.block.number
    faucet.save();
}

export function handleBlock(block: ethereum.Block): void {
    let blockEntity = new Block(block.hash.toHex());
    blockEntity.parentHash = block.parentHash;
    blockEntity.unclesHash = block.unclesHash;
    blockEntity.author = block.author;
    blockEntity.stateRoot = block.stateRoot;
    blockEntity.transactionsRoot = block.transactionsRoot;
    blockEntity.receiptsRoot = block.receiptsRoot;
    blockEntity.number = block.number;
    blockEntity.gasUsed = block.gasUsed;
    blockEntity.gasLimit = block.gasLimit;
    blockEntity.timestamp = block.timestamp;
    blockEntity.difficulty = block.difficulty;
    blockEntity.totalDifficulty = block.totalDifficulty;
    blockEntity.size = block.size;
    blockEntity.save();
  }