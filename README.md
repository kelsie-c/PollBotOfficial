# 📊 PollBot - Interactive Discord Polls Made Easy

Transform your Discord server discussions with beautiful, customizable polls that your community will love to vote on!

## ✨ What PollBot Does

PollBot creates stunning embedded polls that make gathering opinions effortless. Whether you're deciding on movie night picks, gathering feedback, or running community votes, PollBot handles it all with style.

### Key Features
- **🎨 Beautiful Poll Embeds** - Clean, professional-looking polls with custom colors
- **🎯 Up to 12 Options** - Handle simple yes/no questions or complex multi-choice decisions  
- **😊 Custom Emojis** - Use any emojis as voting buttons (with helpful picker shortcuts!)
- **✏️ Edit Functionality** - Fix typos or update options within 15 minutes of posting
- **🔧 Server Customization** - Each server gets its own settings and bot nickname
- **🔔 Role Notifications** - Alert specific roles when new polls are posted
- **⚡ Lightning Fast** - Instant poll creation with automatic reaction setup

## 🚀 Quick Start

### 1. Invite PollBot to Your Server
[Add PollBot to Discord](your-invite-link-here) with the required permissions.

### 2. Create Your First Poll
```
/poll question:"What's for lunch?" option1:"Pizza" option2:"Tacos" option3:"Sushi"
```

### 3. Customize for Your Server (Admins Only)
```
/pollconfig color FF5733          # Set a custom embed color
/pollconfig role @Polls           # Ping a role for new polls  
/pollconfig name CommunityBot     # Change the bot's nickname
/pollconfig emojis 🔥,💯,⭐,❤️   # Set default voting emojis
```

## 📋 Commands Reference

### For Everyone
- `/poll` - Create a poll with up to 10 options and custom emojis

### For Administrators  
- `/pollconfig view` - See current server settings
- `/pollconfig channel` - Set default poll channel
- `/pollconfig role` - Set notification role for new polls
- `/pollconfig color` - Customize embed color (hex codes)
- `/pollconfig emojis` - Set default voting emojis
- `/pollconfig name` - Change bot's server nickname

## 🎨 Customization Examples

### Colorful Community Polls
```
/pollconfig color 9B59B6
/poll question:"Next game night?" option1:"Among Us" option2:"Jackbox" emojis:🎮,🎪
```

### Quick Team Decisions  
```
/poll question:"Deploy to production?" option1:"Yes, ship it!" option2:"Wait, more testing needed" emojis:🚀,⚠️
```

### Fun Community Votes
```
/poll question:"Best pizza topping?" option1:"Pepperoni" option2:"Mushrooms" option3:"Pineapple" option4:"Everything" emojis:🍕,🍄,🍍,🎊
```

## ✏️ Edit Your Polls

Made a typo? No problem! For 15 minutes after creating a poll, you'll get a private "Edit Poll" button that lets you:
- Update the question
- Modify options
- Change emojis
- Fix any mistakes

The original poll updates instantly while preserving all existing votes.

## 🛠️ Required Permissions

PollBot needs these Discord permissions to work properly:
- **Send Messages** - Post polls and responses
- **Use Slash Commands** - Enable `/poll` and `/pollconfig` commands  
- **Add Reactions** - Automatically add voting emojis
- **Embed Links** - Create beautiful poll displays
- **Read Message History** - Edit and update polls
- **Manage Messages** - Clean up command messages
- **Change Nickname** *(optional)* - For server-specific bot names

## 🎯 Pro Tips

### Emoji Shortcuts
- **Windows**: Win + . (period) opens emoji picker
- **Mac**: Cmd + Ctrl + Space opens emoji picker  
- **Mobile**: Use your keyboard's emoji button

### Best Practices
- Keep questions clear and concise
- Use recognizable emojis that match your options
- Set up role notifications to boost participation
- Customize colors to match your server's theme

### Advanced Usage
- Use `/pollconfig channel` to designate a specific polls channel
- Set up a @Polls role for users who want poll notifications
- Change bot nickname to match your server's personality
- Create emoji sets that match your community's style

## 🤖 Legacy Support

PollBot also supports the classic text command format:
```
!poll "Question here?" "Option 1" "Option 2" "Option 3"
```
*Note: Slash commands provide a better experience with more features!*

## 🆘 Need Help?

- **Can't see slash commands?** Make sure the bot has "Use Slash Commands" permission
- **Reactions not working?** Check that the bot can "Add Reactions" in your channel
- **Edit button missing?** Edit buttons expire after 15 minutes for security
- **Bot nickname won't change?** Ensure the bot has "Change Nickname" permission

## 🎉 Ready to Get Started?

[**Add PollBot to Your Server**](your-invite-link-here)

Make every decision a community decision with PollBot!