import { Votingdapp } from "../target/types/votingdapp";
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";

const IDL = require("../target/idl/votingdapp.json");
const votingdappAddress = new PublicKey(
    "coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF"
);

describe("votingdapp", () => {
    // Configure the context to use the local cluster.
    let context;
    let provider;
    let votingdappProgram: Program<Votingdapp>;

    beforeAll(async () => {
        context = await startAnchor(
            "",
            [{ name: "votingdapp", programId: votingdappAddress }],
            []
        );

        provider = new BankrunProvider(context);
        votingdappProgram = new Program<Votingdapp>(IDL, provider);
    });

    it("Initialize Poll", async () => {
        await votingdappProgram.methods
            .initializePoll(
                new anchor.BN(1),
                "What is your favorite fruit?",
                new anchor.BN(0),
                new anchor.BN(1840419987)
            )
            .rpc();

        const [pollAddress] = PublicKey.findProgramAddressSync(
            [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
            votingdappAddress
        );

        const poll = await votingdappProgram.account.poll.fetch(pollAddress);
        console.log(poll);

        expect(poll.pollId.toNumber()).toEqual(1);
        expect(poll.description).toEqual("What is your favorite fruit?");
        expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
    });

    it("Initialize Candidate", async () => {
        await votingdappProgram.methods
            .initializeCandidate("Patrick", new anchor.BN(1))
            .rpc();

        await votingdappProgram.methods
            .initializeCandidate("Gunnar", new anchor.BN(1))
            .rpc();

        const [patrickAddress] = PublicKey.findProgramAddressSync(
            [
                new anchor.BN(1).toArrayLike(Buffer, "le", 8),
                Buffer.from("Patrick"),
            ],
            votingdappAddress
        );

        const [gunnarAddress] = PublicKey.findProgramAddressSync(
            [
                new anchor.BN(1).toArrayLike(Buffer, "le", 8),
                Buffer.from("Gunnar"),
            ],
            votingdappAddress
        );

        const patrickCandidate =
            await votingdappProgram.account.candidate.fetch(patrickAddress);

        const gunnarCandidate = await votingdappProgram.account.candidate.fetch(
            gunnarAddress
        );

        console.log(patrickCandidate);
        console.log(gunnarCandidate);

        expect(patrickCandidate.candidateName).toEqual("Patrick");
        expect(gunnarCandidate.candidateName).toEqual("Gunnar");
    });

    it("Vote", async () => {
        await votingdappProgram.methods.vote("Patrick", new anchor.BN(1)).rpc();
        await votingdappProgram.methods.vote("Gunnar", new anchor.BN(1)).rpc();
        await votingdappProgram.methods.vote("Patrick", new anchor.BN(1)).rpc();
        await votingdappProgram.methods.vote("Gunnar", new anchor.BN(1)).rpc();
        await votingdappProgram.methods.vote("Patrick", new anchor.BN(1)).rpc();

        const [patrickAddress] = PublicKey.findProgramAddressSync(
            [
                new anchor.BN(1).toArrayLike(Buffer, "le", 8),
                Buffer.from("Patrick"),
            ],
            votingdappAddress
        );

        const [gunnarAddress] = PublicKey.findProgramAddressSync(
            [
                new anchor.BN(1).toArrayLike(Buffer, "le", 8),
                Buffer.from("Gunnar"),
            ],
            votingdappAddress
        );

        const patrickCandidate =
            await votingdappProgram.account.candidate.fetch(patrickAddress);

        const gunnarCandidate = await votingdappProgram.account.candidate.fetch(
            gunnarAddress
        );

        console.log(patrickCandidate);
        console.log(gunnarCandidate);

        expect(patrickCandidate.candidateVotes.toNumber()).toEqual(3);
        expect(gunnarCandidate.candidateVotes.toNumber()).toEqual(2);
    });
});
