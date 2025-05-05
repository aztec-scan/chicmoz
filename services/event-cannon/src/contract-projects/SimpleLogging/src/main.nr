use dep::aztec::macros::aztec;

#[aztec]
contract SimpleLogging {
    use dep::aztec::prelude::{Map, PublicMutable};
    use aztec::macros::{functions::{public, initializer, utility, internal},storage::storage};
    #[storage]
    struct Storage<Context> {
        counters: Map<Field, PublicMutable<Field, Context>, Context>,
    }

    #[public]
    #[initializer]
    fn constructor() {
    }

    #[public]
    #[internal]
    fn add_to_counter_public(counter_id: Field) {
        let new_counter_value = storage.counters.at(counter_id).read() + 1;
        storage.counters.at(counter_id).write(new_counter_value);
    }

    #[public]
    fn increase_counter_public(counter_id: Field) {
      context.emit_public_log(/*message=*/ "pub log");
      SimpleLogging::at(context.this_address()).add_to_counter_public(counter_id);
    }

    #[utility]
    unconstrained fn get_counter_value(counter_id: Field) -> pub Field {
        storage.counters.at(counter_id).read()
    }
}
