mod merkle;

use merkle::calculate_root;
use poseidon::poseidon::bn254::{hash_2, hash_3};

fn hasher<let N: u32>(inputs: [Field; N]) -> Field {
    if N == 2 {
        hash_2([inputs[0], inputs[1]])
    } else if N == 3 {
        hash_3([inputs[0], inputs[1], inputs[2]])
    } else {
        panic("Invalid input length: {N}")
    }
}

fn main(
    secret: Field,
    receiver: pub Field,
    amount: pub Field,
    merkle_root: pub Field,
    merkle_path: [Field; 20],
    merkle_index: Field,
) -> pub Field {
    let hash = hasher([receiver, secret]);
    let hash_bytes: [u8; 32] = hash.to_be_bytes();
    let mut address_bytes: [u8; 20] = [0; 20];
    for i in 0..20 {
        address_bytes[i] = hash_bytes[12 + i];
    }
    let burn_address = Field::from_be_bytes(address_bytes);
    let leaf = hasher([burn_address, amount]);
    assert(calculate_root(hasher, leaf, merkle_index, merkle_path) == merkle_root, "Invalid merkle proof");
    let nullifier = hasher([merkle_index, secret, receiver]);
    nullifier
}