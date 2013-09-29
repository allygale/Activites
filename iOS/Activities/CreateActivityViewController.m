//
//  CreateActivityViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <RestKit/RestKit.h>
#import "CreateActivityViewController.h"
#import "GlobalStyles.h"
#import "GlobalNetwork.h"
#import "Activity.h"

@interface CreateActivityViewController ()

@end

@implementation CreateActivityViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        [[self view] setBackgroundColor:[[GlobalStyles sharedGlobal] backgroundGreyColor]];
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    // Enable the scroller
    self.scrollView.contentSize = CGSizeMake(320, 700);
    
    // Restrict events to being created in the next 2 weeks
    self.datePicker.minimumDate = [NSDate date];
    self.datePicker.maximumDate = [NSDate dateWithTimeIntervalSinceNow:60*60*24*14];
    
    // Shrink the datepicker a bit. This is a hack but it is the only option to make it narrow enough to fit on the card (clips otherwise).
    [self.datePicker setTransform:CGAffineTransformMakeScale(0.8, 0.8)];
    
    // Handle dismissing keyboard for text input
    self.activityTitle.delegate = self;
    self.activityLocation.delegate = self;
    
    // TODO: Pull the user's name
    NSString *nameString = @"Owen Campbell-Moore";
    NSString *joinedString = [nameString stringByAppendingString: @" is"];
    NSMutableAttributedString *nameIsString = [[NSMutableAttributedString alloc] initWithString:joinedString attributes:@{}];
    
    // Set create button's color correctly
    UIColor *textBlueColor = [[GlobalStyles sharedGlobal] textBlueColor];
    [self.createButton setTitleColor:textBlueColor forState:UIControlStateNormal];
    [self.createButton setTitleColor:textBlueColor forState:UIControlStateHighlighted];
    
    // Set sections of the text to have the correct styles
    NSDictionary *emphasisTextAttributes = [[GlobalStyles sharedGlobal] emphasisTextAttributes];
    NSRange userNameRange = {0, [nameString length]};
    [nameIsString setAttributes:emphasisTextAttributes range:userNameRange];
    
    NSDictionary *regularTextAttributes = [[GlobalStyles sharedGlobal] regularTextAttributes];
    NSRange isRange = {[nameString length], 3};
    [nameIsString setAttributes:regularTextAttributes range:isRange];
    
    self.nameIsLabel.attributedText = nameIsString;
    
    self.atLabel.attributedText = [[NSAttributedString alloc] initWithString:@"at " attributes:regularTextAttributes];
    
    // Set miscellanious styles
    UIImage *cardBackground = [[UIImage imageNamed:@"cardBackground.png"] resizableImageWithCapInsets:UIEdgeInsetsMake(2.0, 2.0, 3.0, 2.0)];
    self.cardBackgroundView.image = cardBackground;
    [self.createButton setTintColor: [[GlobalStyles sharedGlobal] textBlueColor]];
}

- (BOOL)textFieldShouldReturn:(UITextField *)theTextField {
    if (theTextField == self.activityLocation || theTextField == self.activityTitle) {
        [theTextField resignFirstResponder];
    }
    return YES;
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)createActivityPressed:(id)sender {
    Activity *activity = [[Activity alloc] init];
    activity.title = [[self activityTitle] text];
    activity.description = @"";
    activity.location = [[self activityLocation] text];
    activity.max_attendees = @"-1";
    activity.start_time = [[self datePicker] date];
    
    if (![activity.title isEqualToString:@""] && ![activity.location isEqualToString:@""]) {
        // Send a request to the server to create the new activity
        [[GlobalNetwork sharedGlobal] createActivity:activity];
    
        // Add the event to the set in the app. TODO: Do this in response to success from the server. TODO: Is this the right way to access Activities data?
        [[self superController] addActivity:activity];
        
        // Pop this controller
        [self.navigationController popViewControllerAnimated:YES];
    } else {
        // Some data was missing
    }
}
@end
