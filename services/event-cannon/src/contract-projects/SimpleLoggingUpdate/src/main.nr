use dep::aztec::macros::aztec;

#[aztec]
contract SimpleLoggingUpdate {
    use dep::aztec::prelude::{Map, PublicMutable};
    use dep::aztec::{
        macros::{storage::storage, functions::{public, initializer, utility, internal}},
    };
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
    #[internal]
    fn remove_from_counter_public(counter_id: Field) {
        let new_counter_value = storage.counters.at(counter_id).read() - 1;
        storage.counters.at(counter_id).write(new_counter_value);
    }

    #[public]
    fn decrease_counter_public(counter_id: Field){
      context.emit_public_log(/*message=*/ "pub log");
      SimpleLoggingUpdate::at(context.this_address()).remove_from_counter_public(counter_id);
    }

    #[public]
    fn increase_counter_public(counter_id: Field) {
      context.emit_public_log(/*message=*/ "pub log");
      SimpleLoggingUpdate::at(context.this_address()).add_to_counter_public(counter_id);
    }

    #[utility]
    unconstrained fn get_counter_value(counter_id: Field) -> pub Field {
        storage.counters.at(counter_id).read()
    }
}
