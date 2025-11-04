use dep::aztec::macros::aztec;

#[aztec]
pub contract SimpleLogging {
    use aztec::{
        macros::{functions::{external, initializer}, storage::storage},
        oracle::debug_log::debug_log_format,
        protocol_types::{address::AztecAddress, traits::ToField},
        state_vars::Map,
    };
    use easy_private_state::EasyPrivateUint;

    #[storage]
    struct Storage<Context> {
        counters: Map<AztecAddress, EasyPrivateUint<Context>, Context>,
    }

    #[initializer]
    #[external("private")]
    // We can name our initializer anything we want as long as it's marked as aztec(initializer)
    fn initialize(headstart: u64, owner: AztecAddress) {
        let counters = storage.counters;
        counters.at(owner).add(headstart, owner);
    }

    #[external("private")]
    fn increment(owner: AztecAddress) {
        debug_log_format("Incrementing counter for owner {0}", [owner.to_field()]);
        let counters = storage.counters;
        counters.at(owner).add(1, owner);
    }

    #[external("private")]
    fn increment_twice(owner: AztecAddress) {
        debug_log_format(
            "Incrementing counter twice for owner {0}",
            [owner.to_field()],
        );
        let counters = storage.counters;
        counters.at(owner).add(1, owner);
        counters.at(owner).add(1, owner);
    }

    #[external("private")]
    fn increment_and_decrement(owner: AztecAddress) {
        debug_log_format(
            "Incrementing and decrementing counter for owner {0}",
            [owner.to_field()],
        );
        let counters = storage.counters;
        counters.at(owner).add(1, owner);
        counters.at(owner).sub(1, owner);
    }

    #[external("private")]
    fn decrement(owner: AztecAddress) {
        debug_log_format("Decrementing counter for owner {0}", [owner.to_field()]);
        let counters = storage.counters;
        counters.at(owner).sub(1, owner);
    }

    #[external("utility")]
    unconstrained fn get_counter(owner: AztecAddress) -> Field {
        storage.counters.at(owner).get_value()
    }

    #[external("private")]
    fn increment_self_and_other(other_counter: AztecAddress, owner: AztecAddress) {
        debug_log_format("Incrementing counter for other {0}", [owner.to_field()]);

        let counters = storage.counters;
        counters.at(owner).add(1, owner);

        SimpleLogging::at(other_counter).increment(owner).call(&mut context);
    }

}
