// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockTixPayment
 * @dev Smart contract for managing BlockTix event & cinema ticket payments and refunds on Sepolia testnet.
 */
contract BlockTixPayment {
    // Contract Owner (Deployer)
    address public owner;

    // Fixed Payment Amount: 0.01 ETH
    uint256 public constant TICKET_PRICE = 0.01 ether;

    // Booking Status Enum
    enum BookingStatus { None, Confirmed, Refunded }

    // Structure for storing booking details
    struct Booking {
        string bookingId;
        address payable payer;
        uint256 amount;
        BookingStatus status;
        uint256 timestamp;
    }

    // Mapping from unique booking ID string to Booking record
    mapping(string => Booking) private _bookings;

    // Array to track all registered booking IDs
    string[] private _allBookingIds;

    // Events
    event BookingCreated(
        string indexed bookingIdKey,
        string bookingId,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );

    event BookingCancelled(
        string indexed bookingIdKey,
        string bookingId,
        address indexed payer,
        uint256 refundAmount,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "BlockTix: Caller is not contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Record a ticket booking payment of exactly 0.01 ETH.
     * @param bookingId Unique identification string for the booking.
     */
    function bookTicket(string calldata bookingId) external payable {
        require(bytes(bookingId).length > 0, "BlockTix: Booking ID cannot be empty");
        require(_bookings[bookingId].status == BookingStatus.None, "BlockTix: Duplicate booking ID");
        require(msg.value == TICKET_PRICE, "BlockTix: Payment must be exactly 0.01 ETH");

        _bookings[bookingId] = Booking({
            bookingId: bookingId,
            payer: payable(msg.sender),
            amount: msg.value,
            status: BookingStatus.Confirmed,
            timestamp: block.timestamp
        });

        _allBookingIds.push(bookingId);

        emit BookingCreated(bookingId, bookingId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Cancel an existing active booking and refund exactly 0.01 ETH to the original payer.
     * @param bookingId Unique identification string for the booking to cancel.
     */
    function cancelBooking(string calldata bookingId) external {
        Booking storage booking = _bookings[bookingId];

        // Security check: Must be an active confirmed booking (prevents double refunding)
        require(booking.status == BookingStatus.Confirmed, "BlockTix: Booking not active or already refunded");
        
        // Security check: Only the original payer or contract owner can initiate refund
        require(
            msg.sender == booking.payer || msg.sender == owner,
            "BlockTix: Unauthorized cancellation request"
        );

        // Security check: Contract balance must cover the refund amount
        require(address(this).balance >= TICKET_PRICE, "BlockTix: Insufficient contract balance for refund");

        // Checks-Effects-Interactions pattern: Update status BEFORE external transfer to prevent reentrancy
        booking.status = BookingStatus.Refunded;

        // Transfer exactly 0.01 ETH back to original payer address
        (bool success, ) = booking.payer.call{value: TICKET_PRICE}("");
        require(success, "BlockTix: Refund ETH transfer failed");

        emit BookingCancelled(bookingId, bookingId, booking.payer, TICKET_PRICE, block.timestamp);
    }

    /**
     * @notice Fetch booking details by booking ID.
     * @param bookingId Unique identification string for the booking.
     */
    function getBooking(string calldata bookingId) external view returns (
        string memory id,
        address payer,
        uint256 amount,
        BookingStatus status,
        uint256 timestamp
    ) {
        Booking memory b = _bookings[bookingId];
        return (b.bookingId, b.payer, b.amount, b.status, b.timestamp);
    }

    /**
     * @notice Check if a booking ID exists and is confirmed.
     * @param bookingId Unique identification string for the booking.
     */
    function isBookingConfirmed(string calldata bookingId) external view returns (bool) {
        return _bookings[bookingId].status == BookingStatus.Confirmed;
    }

    /**
     * @notice Get total number of bookings made on contract.
     */
    function getTotalBookings() external view returns (uint256) {
        return _allBookingIds.length;
    }

    /**
     * @notice Fallback function to accept ETH deposits for contract liquidity if required.
     */
    receive() external payable {}
}
