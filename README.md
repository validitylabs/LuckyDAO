# LuckyDAO

LuckyDAO to which subscribed users can send Ether in order to increase chances of winning something. The likelihood of winning increases proportional to the number of Ethers that the luckiDAO received from that address.

# Layout

## Status page (landing page)

* Count-down timer with end of sign up period and finally show winner address
Button to go to sign up page / sub-section
List of addresses and their likelihood to win the game in % and with bars
Own address (e.g. stored in cookie) highlighted/marked
Real-time data feed about new users/investments
Address and QR code of contract
User sign up page
Ethereum address
Name
Street + number
ZIP code
Town
Country
Submit button
Admin page
Requiring login with password
Display all signed up users (accepted and pending)
Not approved users can be accepted or rejected via checkbox
Submit button
Functionality
Web server connected to local geth 
Pending and accepted users stored in local database (e.g. mongoDB)
On public Ethereum chain
Winner address will be displayed and winner will receive something (off-chain)
Approved addresses will be written via web-interface and geth to SC
Payment via fallback function, not via SC function call
Second payment increases balance & triggers probability computing
App acts as oracle
Contract contains end timestamp
Contract is closed after end
Deployment of contract is manual / scripted
