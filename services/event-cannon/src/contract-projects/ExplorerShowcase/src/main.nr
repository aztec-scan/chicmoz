use ::aztec::macros::aztec;

// ExplorerShowcase -- a contract that exercises every explorer-visible feature:
//
//   * Public state reads and writes  (increment_public / get_public_counter)
//   * Public log emission            (emit_message)
//   * Private note creation          (add_private_balance)
//   * Private note consumption       (transfer_private / unshield)
//   * Public<->private transitions   (shield / unshield)
//   * L1->L2 message consumption     (claim_l1_message)
//   * Unconstrained view functions   (get_public_counter / get_admin)
//
// Compile with:  aztec compile   (inside the event-cannon Docker image)
// Do NOT use nargo compile -- it produces incomplete artifacts.
#[aztec]
pub contract ExplorerShowcase {
    use aztec::{
        macros::{
            functions::{external, initializer, only_self},
            storage::storage,
        },
        messages::message_delivery::MessageDelivery,
        note::note_getter_options::NoteGetterOptions,
        protocol::address::{AztecAddress, EthAddress},
        state_vars::{Map, Owned, PrivateSet, PublicImmutable, PublicMutable},
    };
    use field_note::FieldNote;

    // =========================================================================
    // Storage
    // =========================================================================

    #[storage]
    struct Storage<Context> {
        // Immutable admin set at deployment time.
        admin: PublicImmutable<AztecAddress, Context>,

        // Per-address public counter -- incremented by increment_public().
        public_counters: Map<AztecAddress, PublicMutable<u64, Context>, Context>,

        // Per-address private balance -- stored as FieldNotes.
        // Owned<PrivateSet<...>> tracks the owner address via the Map key.
        private_balances: Owned<PrivateSet<FieldNote, Context>, Context>,
    }

    // =========================================================================
    // Initializer
    // =========================================================================

    #[initializer]
    #[external("public")]
    fn initialize(admin: AztecAddress) {
        self.storage.admin.initialize(admin);
    }

    // =========================================================================
    // Public functions
    // =========================================================================

    // Increment the public counter for `owner` by 1.
    #[external("public")]
    fn increment_public(owner: AztecAddress) {
        let current = self.storage.public_counters.at(owner).read();
        self.storage.public_counters.at(owner).write(current + 1);
    }

    // Emit a tagged public log.
    #[external("public")]
    fn emit_message(tag: Field, content: Field) {
        let payload: [Field; 2] = [tag, content];
        self.context.emit_public_log_unsafe(0, payload);
    }

    // Consume an L1->L2 message.
    // Parameters:
    //   content      - the message content hash
    //   secret       - the raw pre-image of the secret hash (NOT pre-hashed)
    //   sender       - the L1 portal contract address
    //   leaf_index   - position of the message in the L1->L2 message tree
    #[external("public")]
    fn claim_l1_message(
        content: Field,
        secret: Field,
        sender: EthAddress,
        leaf_index: Field,
    ) {
        self.context.consume_l1_to_l2_message(content, secret, sender, leaf_index);

        // Credit the admin with 1 public count to make the L2 effect visible.
        let admin = self.storage.admin.read();
        let current = self.storage.public_counters.at(admin).read();
        self.storage.public_counters.at(admin).write(current + 1);
    }

    // Internal public helpers -- only callable by this contract itself.

    // Credit the public counter by `amount`. Called from unshield().
    #[external("public")]
    #[only_self]
    fn _credit_public(owner: AztecAddress, amount: u64) {
        let current = self.storage.public_counters.at(owner).read();
        self.storage.public_counters.at(owner).write(current + amount);
    }

    // Debit the public counter by `amount`. Called from shield().
    #[external("public")]
    #[only_self]
    fn _debit_public(owner: AztecAddress, amount: u64) {
        let current = self.storage.public_counters.at(owner).read();
        assert(current >= amount, "ExplorerShowcase: insufficient public balance");
        self.storage.public_counters.at(owner).write(current - amount);
    }

    // =========================================================================
    // Private functions
    // =========================================================================

    // Create a private FieldNote for the caller worth `amount`.
    #[external("private")]
    fn add_private_balance(amount: u64) {
        let owner = self.msg_sender();
        let note = FieldNote { value: amount as Field };
        self.storage.private_balances.at(owner).insert(note).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );
    }

    // Consume one note and split it: `amount` to `to`, remainder back to sender.
    #[external("private")]
    fn transfer_private(to: AztecAddress, amount: u64) {
        let from = self.msg_sender();

        let options: NoteGetterOptions<FieldNote, 1, Field, Field> =
            NoteGetterOptions::new().set_limit(1);
        let from_notes = self.storage.private_balances.at(from).pop_notes(options);
        assert(from_notes.len() == 1, "ExplorerShowcase: no note found for sender");

        let note_value = from_notes.get(0).value as u64;
        assert(note_value >= amount, "ExplorerShowcase: insufficient note balance");

        let remainder = note_value - amount;
        if remainder > 0 {
            self.storage.private_balances.at(from).insert(
                FieldNote { value: remainder as Field },
            ).deliver(MessageDelivery.ONCHAIN_CONSTRAINED);
        }

        self.storage.private_balances.at(to).insert(FieldNote { value: amount as Field }).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );
    }

    // Move `amount` from public counter into a private note (public->private).
    #[external("private")]
    fn shield(amount: u64) {
        let owner = self.msg_sender();

        self.storage.private_balances.at(owner).insert(
            FieldNote { value: amount as Field },
        ).deliver(MessageDelivery.ONCHAIN_CONSTRAINED);

        self.enqueue_self._debit_public(owner, amount);
    }

    // Move `amount` from a private note back into the public counter (private->public).
    #[external("private")]
    fn unshield(amount: u64) {
        let owner = self.msg_sender();

        let options: NoteGetterOptions<FieldNote, 1, Field, Field> =
            NoteGetterOptions::new().set_limit(1);
        let notes = self.storage.private_balances.at(owner).pop_notes(options);
        assert(notes.len() == 1, "ExplorerShowcase: no note found for unshield");

        let note_value = notes.get(0).value as u64;
        assert(note_value >= amount, "ExplorerShowcase: insufficient note balance for unshield");

        let remainder = note_value - amount;
        if remainder > 0 {
            self.storage.private_balances.at(owner).insert(
                FieldNote { value: remainder as Field },
            ).deliver(MessageDelivery.ONCHAIN_CONSTRAINED);
        }

        self.enqueue_self._credit_public(owner, amount);
    }

    // =========================================================================
    // Utility (unconstrained view) functions
    // =========================================================================

    #[external("utility")]
    unconstrained fn get_public_counter(owner: AztecAddress) -> u64 {
        self.storage.public_counters.at(owner).read()
    }

    #[external("utility")]
    unconstrained fn get_admin() -> AztecAddress {
        self.storage.admin.read()
    }
}
