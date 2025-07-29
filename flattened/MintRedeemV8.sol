[dotenv@17.2.0] injecting env (0) from .env (tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' })
// Sources flattened with hardhat v2.26.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/access/IAccessControl.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/IAccessControl.sol)

pragma solidity >=0.8.4;

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted to signal this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}


// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/utils/introspection/ERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}


// File @openzeppelin/contracts/access/AccessControl.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;



/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` from `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}


// File @openzeppelin/contracts/interfaces/draft-IERC6093.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/draft-IERC6093.sol)
pragma solidity >=0.8.4;

/**
 * @dev Standard ERC-20 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a `spender` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC-721 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-20.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a `tokenId` whose `owner` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC-1155 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     * @param tokenId Identifier number of a token.
     */
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity >=0.6.2;

/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


// File @openzeppelin/contracts/token/ERC20/ERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.20;




/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * Both values are immutable: they can only be set once during construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /// @inheritdoc IERC20
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /// @inheritdoc IERC20
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /// @inheritdoc IERC20
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Skips emitting an {Approval} event indicating an allowance update. This is not
     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner`'s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to
     * true using the following override:
     *
     * ```solidity
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates `owner`'s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}


// File @openzeppelin/contracts/utils/Pausable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


// File contracts/BVIXToken.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.21;


contract BVIXToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address initialOwner) ERC20("BVIX Token", "BVIX") {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/PriceOracle.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.21;



/**
 * @title PriceOracle - Production-Grade Oracle for Volatility Indices
 * @notice Secure oracle with role-based access, TWAP buffer, and timelock
 * @dev BVIX pegged to Volmex BVIV Index, EVIX pegged to Volmex EVIV index
 */
contract PriceOracle is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public price;
    uint256 public lastUpdateTime;
    uint256 public updateDelay; // Timelock delay in seconds
    
    // TWAP buffer for price manipulation protection
    uint256 public constant TWAP_BUFFER = 3 minutes;
    uint256 public lastPriceUpdate;
    
    // Price bounds for safety
    uint256 public constant MIN_PRICE = 1e6;  // $1.00 (6 decimals)
    uint256 public constant MAX_PRICE = 1e12; // $1,000,000 (6 decimals)
    
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event UpdateDelayChanged(uint256 oldDelay, uint256 newDelay);
    event EmergencyPriceUpdate(uint256 newPrice, address updater);

    error PriceOutOfBounds();
    error UpdateTooFrequent();
    error TimelockNotExpired();
    error InvalidPrice();

    constructor(
        uint256 _initialPrice,
        uint256 _updateDelay,
        address _governor
    ) {
        if (_initialPrice < MIN_PRICE || _initialPrice > MAX_PRICE) {
            revert PriceOutOfBounds();
        }
        
        price = _initialPrice;
        lastUpdateTime = block.timestamp;
        lastPriceUpdate = block.timestamp;
        updateDelay = _updateDelay;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _governor);
        _grantRole(GOVERNOR_ROLE, _governor);
        _grantRole(PRICE_UPDATER_ROLE, _governor);
        _grantRole(PAUSER_ROLE, _governor);
        
        // Revoke admin role from deployer
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Update price with timelock protection
     * @param _newPrice New price in 6 decimals (e.g., 1000000 = $1.00)
     */
    function pushPrice(uint256 _newPrice) 
        external 
        onlyRole(PRICE_UPDATER_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        if (_newPrice < MIN_PRICE || _newPrice > MAX_PRICE) {
            revert PriceOutOfBounds();
        }
        
        if (block.timestamp < lastUpdateTime + updateDelay) {
            revert TimelockNotExpired();
        }
        
        if (block.timestamp < lastPriceUpdate + TWAP_BUFFER) {
            revert UpdateTooFrequent();
        }
        
        uint256 oldPrice = price;
        price = _newPrice;
        lastUpdateTime = block.timestamp;
        lastPriceUpdate = block.timestamp;
        
        emit PriceUpdated(oldPrice, _newPrice, block.timestamp);
    }

    /**
     * @notice Emergency price update (bypasses timelock)
     * @param _newPrice New price in 6 decimals
     */
    function emergencyUpdatePrice(uint256 _newPrice) 
        external 
        onlyRole(GOVERNOR_ROLE) 
        nonReentrant 
    {
        if (_newPrice < MIN_PRICE || _newPrice > MAX_PRICE) {
            revert PriceOutOfBounds();
        }
        
        uint256 oldPrice = price;
        price = _newPrice;
        lastUpdateTime = block.timestamp;
        lastPriceUpdate = block.timestamp;
        
        emit EmergencyPriceUpdate(_newPrice, msg.sender);
    }

    /**
     * @notice Get current price
     * @return Current price in 6 decimals
     */
    function getPrice() external view returns (uint256) {
        return price;
    }

    /**
     * @notice Get price with staleness check
     * @return Current price and whether it's stale (>1 hour old)
     */
    function getPriceWithStaleness() external view returns (uint256, bool) {
        bool isStale = block.timestamp > lastUpdateTime + 1 hours;
        return (price, isStale);
    }

    /**
     * @notice Update the timelock delay
     * @param _newDelay New delay in seconds
     */
    function setUpdateDelay(uint256 _newDelay) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldDelay = updateDelay;
        updateDelay = _newDelay;
        emit UpdateDelayChanged(oldDelay, _newDelay);
    }

    /**
     * @notice Pause oracle operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause oracle operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Grant role to address
     * @param role Role to grant
     * @param account Address to grant role to
     */
    function grantRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(GOVERNOR_ROLE) 
    {
        super.grantRole(role, account);
    }

    /**
     * @notice Revoke role from address
     * @param role Role to revoke
     * @param account Address to revoke role from
     */
    function revokeRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(GOVERNOR_ROLE) 
    {
        super.revokeRole(role, account);
    }

    /**
     * @notice Check if price update is allowed
     * @return True if update is allowed
     */
    function canUpdatePrice() external view returns (bool) {
        return block.timestamp >= lastUpdateTime + updateDelay && 
               block.timestamp >= lastPriceUpdate + TWAP_BUFFER;
    }

    /**
     * @notice Get time until next price update is allowed
     * @return Seconds until update is allowed
     */
    function timeUntilUpdateAllowed() external view returns (uint256) {
        uint256 timelockTime = lastUpdateTime + updateDelay;
        uint256 twapTime = lastPriceUpdate + TWAP_BUFFER;
        uint256 requiredTime = timelockTime > twapTime ? timelockTime : twapTime;
        
        if (block.timestamp >= requiredTime) {
            return 0;
        }
        return requiredTime - block.timestamp;
    }
}


// File contracts/MintRedeemV8.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.21;






/**
 * @title MintRedeem V8 - Advanced Liquidation System
 * @notice Production-ready vault with permissionless liquidation, partial liquidation, and enhanced safety features
 * @dev Implements maker-style liquidation with bonus incentives
 */
contract MintRedeemV8 is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

    IERC20 public immutable usdc;
    BVIXToken public immutable bvix;
    PriceOracle public immutable oracle;

    uint256 public mintFee = 30;  // 0.30%
    uint256 public redeemFee = 30;  // 0.30%
    uint256 public minCollateralRatio = 120;
    uint256 public liquidationThreshold = 120; // CR below which liquidation is possible
    uint256 public liquidationBonus = 5; // 5% bonus for liquidators
    uint256 public maxLiquidationDiscount = 10; // Maximum discount on collateral during liquidation
    
    // Liquidation protection
    uint256 public liquidationGracePeriod = 3600; // 1 hour grace period
    bool public permissionlessLiquidation = false; // Start with role-based, can be enabled later
    
    // For tracking liquidatable vaults
    uint256 public nextVaultId = 1;
    mapping(address => uint256) public userVaultId;
    mapping(uint256 => address) public vaultOwner;
    uint256[] public liquidatableVaults;

    struct Position {
        uint256 collateral;  // USDC deposited (6 decimals)
        uint256 debt;        // BVIX minted (18 decimals)
        uint256 lastActivity; // Timestamp of last activity
    }

    mapping(address => Position) public positions;
    uint256 public totalCollateral;
    uint256 public totalDebt;

    event Mint(address indexed user, uint256 usdcAmount, uint256 bvixMinted, uint256 targetCR);
    event Redeem(address indexed user, uint256 bvixAmount, uint256 usdcRedeemed);
    event Liquidation(
        address indexed user, 
        address indexed liquidator, 
        uint256 debtRepaid, 
        uint256 collateralSeized,
        uint256 bonus,
        bool isPartial
    );
    event LiquidationPriceUpdated(uint256 indexed vaultId, uint256 newPrice);
    event FeesUpdated(uint256 oldMintFee, uint256 newMintFee, uint256 oldRedeemFee, uint256 newRedeemFee);
    event CollateralRatioUpdated(uint256 oldMinCR, uint256 newMinCR);
    event LiquidationParamsUpdated(uint256 oldThreshold, uint256 newThreshold, uint256 oldBonus, uint256 newBonus);
    event PermissionlessLiquidationToggled(bool enabled);

    error InsufficientCollateral();
    error InvalidCollateralRatio();
    error PositionNotFound();
    error LiquidationNotAllowed();
    error InvalidAmount();
    error TransferFailed();
    error GracePeriodActive();
    error NotLiquidator();

    constructor(
        address _usdc,
        address _bvix,
        address _oracle,
        address _governor
    ) {
        usdc = IERC20(_usdc);
        bvix = BVIXToken(_bvix);
        oracle = PriceOracle(_oracle);
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _governor);
        _grantRole(GOVERNOR_ROLE, _governor);
        _grantRole(PAUSER_ROLE, _governor);
        _grantRole(LIQUIDATOR_ROLE, _governor);
        
        // Revoke admin role from deployer
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Mint BVIX tokens with USDC collateral
     * @param amount USDC amount to deposit (6 decimals)
     * @param targetCR Target collateral ratio (120-300)
     * @return tokensToMint Amount of BVIX minted
     */
    function mintWithCollateralRatio(uint256 amount, uint256 targetCR) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        if (amount == 0) revert InvalidAmount();
        if (targetCR < 120 || targetCR > 300) revert InvalidCollateralRatio();

        uint256 price = oracle.getPrice();
        uint256 fee = (amount * mintFee) / 10000;
        uint256 netAmount = amount - fee;

        // Calculate debt based on target CR
        uint256 debtValue = (netAmount * 100) / targetCR;
        uint256 tokensToMint = (debtValue * 1e30) / price;

        if (tokensToMint == 0) revert InvalidAmount();

        // Check global CR after mint
        uint256 futureCollateral = totalCollateral + netAmount;
        uint256 futureDebtValue = ((totalDebt + tokensToMint) * price) / 1e18 / 1e12;
        uint256 futureCR = (futureCollateral * 100) / futureDebtValue;
        if (futureCR < minCollateralRatio) revert InvalidCollateralRatio();

        // Create vault ID if new user
        if (userVaultId[msg.sender] == 0) {
            userVaultId[msg.sender] = nextVaultId;
            vaultOwner[nextVaultId] = msg.sender;
            nextVaultId++;
        }

        // Update position and totals
        positions[msg.sender].collateral += netAmount;
        positions[msg.sender].debt += tokensToMint;
        positions[msg.sender].lastActivity = block.timestamp;
        totalCollateral += netAmount;
        totalDebt += tokensToMint;

        if (!usdc.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        bvix.mint(msg.sender, tokensToMint);

        // Update liquidation tracking
        _updateLiquidationStatus(msg.sender);
        
        emit Mint(msg.sender, amount, tokensToMint, targetCR);
        return tokensToMint;
    }

    /**
     * @notice Redeem USDC by burning BVIX tokens
     * @param amount BVIX amount to burn (18 decimals)
     * @return netRefund USDC amount refunded
     */
    function redeem(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        if (amount == 0) revert InvalidAmount();
        
        Position storage pos = positions[msg.sender];
        if (pos.debt < amount) revert InsufficientCollateral();

        uint256 price = oracle.getPrice();
        
        // Calculate proportional collateral refund (including surplus)
        uint256 collateralRefund = (amount * pos.collateral) / pos.debt;
        uint256 fee = (collateralRefund * redeemFee) / 10000;
        uint256 netRefund = collateralRefund - fee;

        // Update position and totals
        pos.collateral -= collateralRefund;
        pos.debt -= amount;
        pos.lastActivity = block.timestamp;
        totalCollateral -= collateralRefund;
        totalDebt -= amount;

        bvix.burn(msg.sender, amount);
        if (!usdc.transfer(msg.sender, netRefund)) revert TransferFailed();

        // Update liquidation tracking
        _updateLiquidationStatus(msg.sender);

        emit Redeem(msg.sender, amount, netRefund);
        return netRefund;
    }

    /**
     * @notice Liquidate an undercollateralized position (partial or full)
     * @param user Address of the user to liquidate
     * @param repayAmount Amount of BVIX to repay (0 for max liquidation)
     */
    function liquidate(address user, uint256 repayAmount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        // Check if caller is authorized
        if (!permissionlessLiquidation && !hasRole(LIQUIDATOR_ROLE, msg.sender)) {
            revert NotLiquidator();
        }

        Position storage pos = positions[user];
        if (pos.debt == 0) revert PositionNotFound();

        uint256 price = oracle.getPrice();
        uint256 debtValue = (pos.debt * price) / 1e30;
        uint256 userCR = (pos.collateral * 100) / debtValue;

        if (userCR >= liquidationThreshold) revert LiquidationNotAllowed();

        // Check grace period (only for positions that recently became undercollateralized)
        if (block.timestamp < pos.lastActivity + liquidationGracePeriod) {
            revert GracePeriodActive();
        }

        // Determine liquidation amount
        uint256 debtToRepay;
        if (repayAmount == 0 || repayAmount >= pos.debt) {
            // Full liquidation
            debtToRepay = pos.debt;
        } else {
            // Partial liquidation
            debtToRepay = repayAmount;
        }

        // Calculate collateral to seize with bonus
        uint256 debtValueRepaid = (debtToRepay * price) / 1e30;
        uint256 baseCollateral = debtValueRepaid;
        uint256 bonus = (baseCollateral * liquidationBonus) / 100;
        uint256 totalSeized = baseCollateral + bonus;

        // Ensure we don't seize more than available
        if (totalSeized > pos.collateral) {
            totalSeized = pos.collateral;
        }

        bool isPartial = debtToRepay < pos.debt;

        // Update position and totals
        pos.collateral -= totalSeized;
        pos.debt -= debtToRepay;
        pos.lastActivity = block.timestamp;
        totalCollateral -= totalSeized;
        totalDebt -= debtToRepay;

        // Transfer tokens
        bvix.transferFrom(msg.sender, address(this), debtToRepay);
        bvix.burn(address(this), debtToRepay);
        if (!usdc.transfer(msg.sender, totalSeized)) revert TransferFailed();

        // Update liquidation tracking
        _updateLiquidationStatus(user);

        emit Liquidation(user, msg.sender, debtToRepay, totalSeized, bonus, isPartial);
    }

    /**
     * @notice Get all vaults below liquidation threshold
     * @return Array of vault IDs that can be liquidated
     */
    function getVaultsBelowThreshold() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256[] memory tempVaults = new uint256[](nextVaultId);
        
        for (uint256 i = 1; i < nextVaultId; i++) {
            address owner = vaultOwner[i];
            if (owner != address(0)) {
                uint256 cr = getUserCollateralRatio(owner);
                if (cr > 0 && cr < liquidationThreshold) {
                    tempVaults[count] = i;
                    count++;
                }
            }
        }

        // Create properly sized array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempVaults[i];
        }
        
        return result;
    }

    /**
     * @notice Get liquidation details for a vault
     * @param vaultId The vault ID to check
     */
    function getLiquidationDetails(uint256 vaultId) external view returns (
        address owner,
        uint256 collateral,
        uint256 debt,
        uint256 currentCR,
        uint256 liquidationPrice,
        uint256 maxBonus,
        bool canLiquidate
    ) {
        owner = vaultOwner[vaultId];
        if (owner == address(0)) return (address(0), 0, 0, 0, 0, 0, false);
        
        Position memory pos = positions[owner];
        collateral = pos.collateral;
        debt = pos.debt;
        currentCR = getUserCollateralRatio(owner);
        liquidationPrice = getLiquidationPrice(owner);
        
        if (currentCR > 0 && currentCR < liquidationThreshold) {
            uint256 price = oracle.getPrice();
            uint256 debtValue = (debt * price) / 1e30;
            maxBonus = (debtValue * liquidationBonus) / 100;
            canLiquidate = true;
        }
    }

    /**
     * @notice Get global collateral ratio
     * @return Current collateral ratio
     */
    function getCollateralRatio() public view returns (uint256) {
        if (totalDebt == 0) return 0;
        uint256 price = oracle.getPrice();
        uint256 debtValue = (totalDebt * price) / 1e18 / 1e12;
        return (totalCollateral * 100) / debtValue;
    }

    /**
     * @notice Get user's collateral ratio
     * @param user User address
     * @return User's collateral ratio
     */
    function getUserCollateralRatio(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return 0;
        uint256 price = oracle.getPrice();
        uint256 debtValue = (pos.debt * price) / 1e30;
        return (pos.collateral * 100) / debtValue;
    }

    /**
     * @notice Get liquidation price for a user
     * @param user User address
     * @return Price at which user's position can be liquidated
     */
    function getLiquidationPrice(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return 0;
        // P_liq = collateral / (debt * liquidationThreshold / 100)
        return (pos.collateral * 100 * 1e30) / (pos.debt * liquidationThreshold);
    }

    /**
     * @notice Update liquidation tracking for a user
     * @param user User address
     */
    function _updateLiquidationStatus(address user) internal {
        uint256 vaultId = userVaultId[user];
        if (vaultId > 0) {
            uint256 newPrice = getLiquidationPrice(user);
            emit LiquidationPriceUpdated(vaultId, newPrice);
        }
    }

    // Admin functions

    /**
     * @notice Toggle permissionless liquidation
     * @param enabled Whether to enable permissionless liquidation
     */
    function setPermissionlessLiquidation(bool enabled) external onlyRole(GOVERNOR_ROLE) {
        permissionlessLiquidation = enabled;
        emit PermissionlessLiquidationToggled(enabled);
    }

    /**
     * @notice Update grace period
     * @param _gracePeriod New grace period in seconds
     */
    function setLiquidationGracePeriod(uint256 _gracePeriod) external onlyRole(GOVERNOR_ROLE) {
        liquidationGracePeriod = _gracePeriod;
    }

    /**
     * @notice Update mint and redeem fees
     * @param _mintFee New mint fee (basis points)
     * @param _redeemFee New redeem fee (basis points)
     */
    function setFees(uint256 _mintFee, uint256 _redeemFee) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldMintFee = mintFee;
        uint256 oldRedeemFee = redeemFee;
        mintFee = _mintFee;
        redeemFee = _redeemFee;
        emit FeesUpdated(oldMintFee, _mintFee, oldRedeemFee, _redeemFee);
    }

    /**
     * @notice Update minimum collateral ratio
     * @param _minCR New minimum collateral ratio
     */
    function setMinCollateralRatio(uint256 _minCR) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldMinCR = minCollateralRatio;
        minCollateralRatio = _minCR;
        emit CollateralRatioUpdated(oldMinCR, _minCR);
    }

    /**
     * @notice Update liquidation parameters
     * @param _threshold New liquidation threshold
     * @param _bonus New liquidation bonus
     */
    function setLiquidationParams(uint256 _threshold, uint256 _bonus) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldThreshold = liquidationThreshold;
        uint256 oldBonus = liquidationBonus;
        liquidationThreshold = _threshold;
        liquidationBonus = _bonus;
        emit LiquidationParamsUpdated(oldThreshold, _threshold, oldBonus, _bonus);
    }

    /**
     * @notice Pause all operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause all operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Emergency function to sweep tokens (governor only)
     * @param token Token to sweep
     * @param to Recipient address
     * @param amount Amount to sweep
     */
    function sweepTokens(address token, address to, uint256 amount) external onlyRole(GOVERNOR_ROLE) {
        IERC20(token).transfer(to, amount);
    }

    /**
     * @notice Grant role to address
     * @param role Role to grant
     * @param account Address to grant role to
     */
    function grantRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(GOVERNOR_ROLE) 
    {
        super.grantRole(role, account);
    }

    /**
     * @notice Revoke role from address
     * @param role Role to revoke
     * @param account Address to revoke role from
     */
    function revokeRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(GOVERNOR_ROLE) 
    {
        super.revokeRole(role, account);
    }
}
