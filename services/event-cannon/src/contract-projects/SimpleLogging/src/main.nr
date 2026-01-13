use dep::aztec::macros::aztec;

#[aztec]
pub contract SimpleLogging {
    use aztec::{
        macros::{
            functions::{external, initializer},
            storage::storage,
        },
        protocol_types::address::AztecAddress,
        state_vars::{Map, PublicMutable},
    };

    #[storage]
    struct Storage<Context> {
        counters: Map<AztecAddress, PublicMutable<u64, Context>, Context>,
    }

    #[initializer]
    #[external("public")]
    fn initialize(headstart: u64, owner: AztecAddress) {
        self.storage.counters.at(owner).write(headstart);
    }

    #[external("public")]
    fn increment(owner: AztecAddress) {
        let new_value = self.storage.counters.at(owner).read() + 1;
        self.storage.counters.at(owner).write(new_value);
    }

    #[external("utility")]
    unconstrained fn get_counter(owner: AztecAddress) -> u64 {
        self.storage.counters.at(owner).read()
    }
}
