pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template HCSThreshold() {
    // Private inputs (never leave the browser)
    signal input score;       // HCS 0-100
    signal input salt;        // Random blinding factor

    // Public inputs (included in the proof)
    signal input threshold;   // e.g. 60
    signal input commitment;  // Poseidon(score, salt)

    // 1. score >= threshold  (7 bits covers 0-127)
    component gte = GreaterEqThan(7);
    gte.in[0] <== score;
    gte.in[1] <== threshold;
    gte.out === 1;

    // 2. Commitment binds the private score
    component hash = Poseidon(2);
    hash.inputs[0] <== score;
    hash.inputs[1] <== salt;
    hash.out === commitment;
}

component main { public [threshold, commitment] } = HCSThreshold();
