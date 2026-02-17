// M is the max depth of the merkle tree
pub fn calculate_root<let M: u32>(hasher: fn([Field; 2]) -> Field, leaf: Field, index: Field, paths: [Field; M]) -> Field {
    let mut hash = leaf;

    let mut idx = index as u32;
    for i in 0..paths.len() {
        if paths[i] != 0 {
            let is_right = ((idx & 1) == 0) as bool;
            let (hash_left, hash_right) = if is_right {
                (hash, paths[i])
            } else {
                (paths[i], hash)
            };
            hash = hasher([hash_left, hash_right]);
            idx >>= 1;
        }
    };

    hash
}